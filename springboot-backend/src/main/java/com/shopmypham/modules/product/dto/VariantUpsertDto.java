package com.shopmypham.modules.product.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.Map;

@Data
public class VariantUpsertDto {
  private Long id;

  @NotBlank
  private String sku;

  @NotNull
  @DecimalMin(value="0.0", inclusive=true)
  private BigDecimal price;

  @DecimalMin(value="0.0", inclusive=true)
  private BigDecimal salePrice;

  // ❌ Không nhập tồn ở đây nữa
  private Map<String,String> options;

  private Boolean active = true;
}
