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
         @Index(name="idx_inv_supplier", columnList = "supplier_id"),
         @Index(name="idx_inv_reversed_of", columnList = "reversed_of_id"),
         @Index(name="idx_inv_deleted", columnList = "deleted_at")
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

  /** ref đến chứng từ nguồn (vd: orderId, phiếu id) */
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

  /** nếu là bản ghi đối ứng thì trỏ về id gốc */
  @Column(name = "reversed_of_id")
  private Long reversedOfId;

  /** khoá khi là bút toán hệ thống */
  @Column(name = "locked", nullable = false, columnDefinition = "tinyint(1) default 0")
  private boolean locked = false;

  /** xoá mềm */
  @Column(name = "deleted_at")
  private LocalDateTime deletedAt;

  public boolean isReversal(){ return reversedOfId != null; }
  public boolean isDeleted(){ return deletedAt != null; }
}
