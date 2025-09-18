package com.shopmypham.modules.inventory;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_movements",
       indexes = {
         @Index(name="idx_inv_prod_var", columnList = "product_id,variant_id"),
         @Index(name="idx_inv_reason_created", columnList = "reason,created_at"),
         @Index(name="idx_inv_supplier", columnList = "supplier_id")
       })
@Getter @Setter
public class InventoryMovement {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name="product_id", nullable=false)
  private Long productId;

  @Column(name="variant_id")
  private Long variantId;

  @Column(name="change_qty", nullable=false)
  private Integer changeQty;

  @Enumerated(EnumType.STRING)
  @Column(nullable=false, columnDefinition = "ENUM('purchase','purchase_return','order','refund','adjustment','manual','initial','cancel') default 'manual'")
  private InventoryReason reason = InventoryReason.manual;

  @Column(name="ref_id")
  private Long refId;

  @Column(name="supplier_id")
  private Long supplierId;

  @Column(name="unit_cost", precision = 19, scale = 2)
  private BigDecimal unitCost;

  @Column(name="doc_no", length = 80)
  private String docNo;

  @Column(name="created_at", insertable = false, updatable = false)
  private LocalDateTime createdAt;
}
