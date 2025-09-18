// dto/ProductImageDto.java (cập nhật: thêm variantId)
package com.shopmypham.modules.product.dto;
import lombok.Builder; import lombok.Data;

@Data @Builder
public class ProductImageDto {
  private Long id;
  private String url;
  private String publicId;
  private String alt;
  private Integer sortOrder;
  private Long variantId; // NEW
}
