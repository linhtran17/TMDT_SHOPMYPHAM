package com.shopmypham.modules.inventory.dto;

import com.shopmypham.modules.inventory.InventoryMovement;
import com.shopmypham.modules.inventory.InventoryReason;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO cho một dòng sổ kho (inventory movement).
 * Có thêm supplierName để FE hiển thị tên NCC.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovementDTO {
  private Long id;
  private Long productId;
  private Long variantId;
  private Integer changeQty;
  private InventoryReason reason;
  private Long supplierId;
  private String supplierName;   // <- tên nhà cung cấp (enrich ở service)
  private BigDecimal unitCost;
  private String docNo;
  private LocalDateTime createdAt;

  /** Map entity -> DTO kèm tên NCC (đã tra sẵn). */
  public static MovementDTO from(InventoryMovement m, String supplierName) {
    return MovementDTO.builder()
        .id(m.getId())
        .productId(m.getProductId())
        .variantId(m.getVariantId())
        .changeQty(m.getChangeQty())
        .reason(m.getReason())
        .supplierId(m.getSupplierId())
        .supplierName(supplierName)
        .unitCost(m.getUnitCost())
        .docNo(m.getDocNo())
        .createdAt(m.getCreatedAt())
        .build();
  }

  /** Map entity -> DTO (không kèm tên NCC). */
  public static MovementDTO from(InventoryMovement m) {
    return from(m, null);
  }
}
