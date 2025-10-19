package com.shopmypham.modules.cart;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.cart.dto.*;
import com.shopmypham.modules.inventory.InventoryMovementRepository;
import com.shopmypham.modules.product.Product;
import com.shopmypham.modules.product.ProductRepository;
import com.shopmypham.modules.product.ProductVariant;
import com.shopmypham.modules.product.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class CartService {

  private final CartRepository cartRepo;
  private final CartItemRepository itemRepo;
  private final ProductRepository productRepo;
  private final ProductVariantRepository variantRepo;
  private final InventoryMovementRepository invRepo;
  private final ObjectMapper om = new ObjectMapper();

  private Cart getOrCreateCart(Long userId){
    return cartRepo.findByUserId(userId).orElseGet(() -> {
      var c = new Cart(); c.setUserId(userId); return cartRepo.save(c);
    });
  }
  private Cart mustGetCart(Long userId){
    return cartRepo.findByUserId(userId).orElseThrow(() -> new NotFoundException("Giỏ không tồn tại"));
  }

  private Product findProduct(Long id){
    return productRepo.findById(id).orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));
  }
  private ProductVariant findVariant(Long id){
    return variantRepo.findById(id).orElseThrow(() -> new NotFoundException("Biến thể không tồn tại"));
  }
   private int availableOf(Long productId, Long variantId){
    Integer raw = (variantId != null)
        ? invRepo.variantQty(variantId)
        : invRepo.productQty(productId);
    return Math.max(0, Optional.ofNullable(raw).orElse(0));
  }


  // ===== API ops =====

  @Transactional
  public void addItem(Long userId, CartAddItemRequest req){
    var product = findProduct(req.getProductId());
    Long variantId = req.getVariantId();

    if (Boolean.TRUE.equals(product.getHasVariants())) {
      if (variantId == null) throw new BadRequestException("Vui lòng chọn biến thể");
      var v = findVariant(variantId);
      if (!Objects.equals(v.getProduct().getId(), product.getId()))
        throw new BadRequestException("Biến thể không thuộc sản phẩm");
    } else {
      variantId = null; // ép null
    }

    var cart = getOrCreateCart(userId);
 var existed = itemRepo.findByCartIdAndProductIdAndVariantId(
        cart.getId(), product.getId(), variantId).orElse(null);
   int available = availableOf(product.getId(), variantId);
    int currentInCart = existed != null ? existed.getQuantity() : 0;
    int after = currentInCart + Math.max(1, req.getQty());

    if (after > available){
      throw new BadRequestException(
          available > 0
              ? ("Chỉ còn " + available + " sản phẩm trong kho")
              : "Sản phẩm đã hết hàng");
    }


    if (existed != null){
      existed.setQuantity(existed.getQuantity() + req.getQty());
      itemRepo.save(existed);
    }else{
      var it = new CartItem();
      it.setCartId(cart.getId());
      it.setProductId(product.getId());
      it.setVariantId(variantId);
      it.setQuantity(req.getQty());
      it.setOptionsSnapshot(writeJson(req.getOptions()));
      itemRepo.save(it);
    }
  }

  @Transactional
  public void updateQty(Long userId, Long itemId, int qty){
    if (qty < 1) throw new BadRequestException("Số lượng tối thiểu 1");
    var cart = mustGetCart(userId); // ✅ không tạo mới
    var it = itemRepo.findById(itemId).orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));
    if (!Objects.equals(it.getCartId(), cart.getId())) throw new BadRequestException("Sản phẩm không thuộc giỏ này");
    it.setQuantity(qty);
  }

  @Transactional
  public void removeItem(Long userId, Long itemId){
    var cart = mustGetCart(userId); // ✅ không tạo mới
    var it = itemRepo.findById(itemId).orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại"));
    if (!Objects.equals(it.getCartId(), cart.getId())) throw new BadRequestException("Sản phẩm không thuộc giỏ này");
    itemRepo.deleteById(itemId);
  }

  @Transactional(readOnly = true)
  public CartView view(Long userId){
    var cart = cartRepo.findByUserId(userId).orElse(null);
    if (cart == null) return emptyView();

    var items = itemRepo.findByCartIdOrderByIdAsc(cart.getId());
    if (items.isEmpty()) return emptyView();

    var lines = new ArrayList<CartLine>();
    BigDecimal subtotal = BigDecimal.ZERO;

    for (var it : items){
      var p = findProduct(it.getProductId());
      var price = p.getSalePrice() != null ? p.getSalePrice() : p.getPrice();
      String sku = p.getSku();
      String title = p.getName();

      Integer available;
      if (it.getVariantId() != null){
        var v = findVariant(it.getVariantId());
        price = v.getSalePrice()!=null ? v.getSalePrice() : v.getPrice();
        sku = v.getSku();
        available = Optional.ofNullable(invRepo.variantQty(v.getId())).orElse(0);
      }else{
        available = Optional.ofNullable(invRepo.productQty(p.getId())).orElse(0);
      }

      var unit = price;
      var lineTotal = unit.multiply(BigDecimal.valueOf(it.getQuantity()));
      subtotal = subtotal.add(lineTotal);

      lines.add(CartLine.builder()
          .id(it.getId())
          .productId(p.getId())
          .variantId(it.getVariantId())
          .productName(title)
          .productSku(sku)
          .options(readJson(it.getOptionsSnapshot()))
          .qty(it.getQuantity())
          .unitPrice(unit)
          .lineTotal(lineTotal)
          .available(available)
          .thumbnail(null)
          .build());
    }

    BigDecimal shipping = subtotal.compareTo(new BigDecimal("300000")) >= 0 ? BigDecimal.ZERO : new BigDecimal("30000");
    BigDecimal discount = BigDecimal.ZERO;
    BigDecimal tax = BigDecimal.ZERO;
    BigDecimal total = subtotal.add(shipping).subtract(discount).add(tax);

    return CartView.builder().items(lines).subtotal(subtotal)
        .shippingFee(shipping).discount(discount).tax(tax).total(total).build();
  }

  @Transactional
  public void clear(Long userId){
    cartRepo.findByUserId(userId).ifPresent(c -> {
      var items = itemRepo.findByCartIdOrderByIdAsc(c.getId());
      itemRepo.deleteAll(items);
    });
  }

  private CartView emptyView(){
    return CartView.builder()
        .items(List.of())
        .subtotal(BigDecimal.ZERO).shippingFee(BigDecimal.ZERO).discount(BigDecimal.ZERO).tax(BigDecimal.ZERO).total(BigDecimal.ZERO)
        .build();
  }

  // helpers
  private String writeJson(Map<String,String> map){
    try { return map==null? null : om.writeValueAsString(map); } catch (Exception e){ return null; }
  }
  private Map<String,String> readJson(String json){
    try { return json==null? null : om.readValue(json, new TypeReference<Map<String,String>>(){}); } catch (Exception e){ return null; }
  }
}
