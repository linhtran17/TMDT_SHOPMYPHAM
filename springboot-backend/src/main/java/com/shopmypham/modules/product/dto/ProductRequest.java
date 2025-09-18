package com.shopmypham.modules.product.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductRequest {
  @NotBlank private String name;
  private String sku;

  // Khi hasVariants=false thì price bắt buộc; khi true có thể truyền 0/nullable.
  @DecimalMin(value="0.0", inclusive=true) private BigDecimal price;
  @DecimalMin(value="0.0", inclusive=true) private BigDecimal salePrice;

  // ❌ Không cho nhập tồn kho ở cấp sản phẩm
  private String shortDesc;
  private String description;

  @NotNull private Long categoryId;
  private Boolean featured = false;
  private Boolean active = true;
  private Boolean hasVariants = false;
}
