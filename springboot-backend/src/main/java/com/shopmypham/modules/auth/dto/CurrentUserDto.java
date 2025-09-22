package com.shopmypham.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserDto {
  private Long id;
  private String fullName;
  private String email;
  private Set<String> roles;
  private Set<String> authorities;
}
