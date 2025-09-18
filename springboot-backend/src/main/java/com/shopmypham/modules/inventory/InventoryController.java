package com.shopmypham.modules.inventory;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.inventory.dto.MovementCreateRequest;
import com.shopmypham.modules.inventory.dto.MovementDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

  private final InventoryService service;

  // ---- STOCK (được whitelist public trong SecurityConfig nếu bạn muốn)
  @GetMapping("/stock/products/{productId}")
  public ApiResponse<Integer> productQty(@PathVariable long productId){
    return ApiResponse.ok(service.productQty(productId));
  }

  @GetMapping("/stock/variants/{variantId}")
  public ApiResponse<Integer> variantQty(@PathVariable long variantId){
    return ApiResponse.ok(service.variantQty(variantId));
  }

  // ---- MOVEMENTS
  @PostMapping("/movements")
  @PreAuthorize("hasAnyAuthority('inventory:write','inventory:create')")
  public ApiResponse<MovementDTO> create(@Valid @RequestBody MovementCreateRequest req){
    return ApiResponse.ok(service.create(req));
  }

  @GetMapping("/movements")
  @PreAuthorize("hasAuthority('inventory:read')")
  public ApiResponse<Page<MovementDTO>> list(
      @RequestParam(required = false) Long productId,
      @RequestParam(required = false) Long variantId,
      @RequestParam(required = false) Long supplierId,
      @RequestParam(required = false) InventoryReason reason,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
      @RequestParam(required = false) String docNo,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size
  ){
    return ApiResponse.ok(service.list(productId, variantId, supplierId, reason, from, to, docNo, page, size));
  }

  @DeleteMapping("/movements/{id}")
  @PreAuthorize("hasAuthority('inventory:delete')")
  public ApiResponse<Void> delete(@PathVariable long id){
    service.delete(id); return ApiResponse.ok();
  }
}
