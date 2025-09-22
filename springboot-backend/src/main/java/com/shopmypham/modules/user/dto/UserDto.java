package com.shopmypham.modules.user.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data @Builder
public class UserDto {
  private Long id;
  private String fullName;
  private String email;
  private String phone;
  private String address;
  private String avatarUrl;
  private Boolean enabled;
  private Instant createdAt;
  private Instant updatedAt;
  private List<String> roles;  // ["ROLE_ADMIN", "ROLE_USER"]
}