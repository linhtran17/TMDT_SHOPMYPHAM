package com.shopmypham.modules.inventory;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.inventory.dto.MovementCreateRequest;
import com.shopmypham.modules.inventory.dto.MovementDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

  private final InventoryService service;

  @GetMapping("/stock/products/{productId}")
  public ApiResponse<Integer> productQty(@PathVariable long productId){
    return ApiResponse.ok(service.productQty(productId));
  }

  @GetMapping("/stock/variants/{variantId}")
  public ApiResponse<Integer> variantQty(@PathVariable long variantId){
    return ApiResponse.ok(service.variantQty(variantId));
  }

  @PostMapping("/movements")
  @PreAuthorize("hasAnyAuthority('inventory:write','inventory:create')")
  @Transactional
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

  @PostMapping("/movements/{id}/reverse")
  @PreAuthorize("hasAnyAuthority('inventory:write','inventory:delete')")
  @Transactional
  public ApiResponse<MovementDTO> reverse(@PathVariable long id){
    return ApiResponse.ok(service.reverse(id));
  }

  @DeleteMapping("/movements/{id}")
  @PreAuthorize("hasAuthority('inventory:delete')")
  @Transactional
  public ApiResponse<Void> delete(@PathVariable long id){
    service.softDelete(id);
    return ApiResponse.ok();
  }
}
