package com.shopmypham.modules.inventory.dto;

import com.shopmypham.modules.inventory.InventoryReason;
import jakarta.validation.constraints.NotNull;
import lombok.Getter; import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class MovementCreateRequest {
  @NotNull private Long productId;
  private Long variantId; // null nếu ghi sổ cấp product

  @NotNull private Integer changeQty; // + nhập / - xuất
  @NotNull private InventoryReason reason;

  private Long refId;
  private Long supplierId;
  private BigDecimal unitCost;
  private String docNo;
}
