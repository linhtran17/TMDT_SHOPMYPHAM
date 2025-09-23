package com.shopmypham.modules.wishlist;

import lombok.Value;

@Value
public class WishlistItemDto {
  Long productId;
  String name;
  String image;      // có thể null -> FE dùng placeholder
  Integer price;
  Integer salePrice;

  public static WishlistItemDto of(Wishlist w, String image){
    var p = w.getProduct();
    return new WishlistItemDto(
        p.getId(),
        p.getName(),
        image,
        p.getPrice() == null ? null : p.getPrice().intValue(),
        p.getSalePrice() == null ? null : p.getSalePrice().intValue()
    );
  }
}
