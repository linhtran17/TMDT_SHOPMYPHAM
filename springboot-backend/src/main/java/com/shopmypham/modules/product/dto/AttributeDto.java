// dto/AttributeDto.java
package com.shopmypham.modules.product.dto;
import lombok.Builder; import lombok.Data;

@Data @Builder
public class AttributeDto {
  private Long id;
  private String name;
  private String value;
}
