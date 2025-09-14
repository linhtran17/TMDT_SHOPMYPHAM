package com.shopmypham.modules.banner.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class BannerDto {
  private Long id;
  private String title;
  @NotBlank private String imageUrl;  // secureUrl từ Cloudinary
  private String publicId;            // để xoá khi cần
  private String link;
  private Integer sortOrder;
  private Boolean active;
}
