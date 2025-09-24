package com.shopmypham.modules.inventory.dto;

import com.shopmypham.modules.inventory.InventoryMovement;
import com.shopmypham.modules.inventory.InventoryReason;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MovementDTO {
  private Long id;
  private Long productId;
  private Long variantId;
  private Integer changeQty;
  private InventoryReason reason;
  private Long supplierId;
  private String supplierName;
  private BigDecimal unitCost;
  private String docNo;
  private LocalDateTime createdAt;

  // NEW
  private Long refId;
  private Long reversedOfId;
  private Boolean locked;
  private LocalDateTime deletedAt;

  public static MovementDTO from(InventoryMovement m, String supplierName){
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
        .refId(m.getRefId())
        .reversedOfId(m.getReversedOfId())
        .locked(m.isLocked())
        .deletedAt(m.getDeletedAt())
        .build();
  }
  public static MovementDTO from(InventoryMovement m){ return from(m, null); }
}
