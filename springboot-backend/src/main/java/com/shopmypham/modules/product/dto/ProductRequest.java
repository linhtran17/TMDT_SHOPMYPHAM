package com.shopmypham.modules.product.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
  @NotBlank private String name;
  private String sku;
  @NotNull @DecimalMin(value="0.0", inclusive=true) private BigDecimal price;
  @Min(0) private Integer stock = 0;
  private String description;
  @NotNull private Long categoryId;
}
