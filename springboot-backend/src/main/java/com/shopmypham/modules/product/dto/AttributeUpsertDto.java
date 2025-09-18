// dto/AttributeUpsertDto.java
package com.shopmypham.modules.product.dto;
import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class AttributeUpsertDto {
  private Long id; // null => create
  @NotBlank private String name;
  @NotBlank private String value;
}
