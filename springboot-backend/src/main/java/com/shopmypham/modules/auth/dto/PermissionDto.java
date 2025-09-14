package com.shopmypham.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data @AllArgsConstructor
public class PermissionDto {
  private Long id;
  private String name;
  private String description;

  public static PermissionDto of(com.shopmypham.modules.auth.Permission p){
    return new PermissionDto(p.getId(), p.getName(), p.getDescription());
  }
}
