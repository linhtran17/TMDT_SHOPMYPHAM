package com.shopmypham.modules.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.LinkedHashSet;
import java.util.Set;

@Data @Builder
public class RoleDto {
  private Long id;
  private String name;
  private Set<String> permissions;

  public static RoleDto of(com.shopmypham.modules.auth.Role r) {
    Set<String> perms = new LinkedHashSet<>();
    if (r.getPermissions() != null) {
      r.getPermissions().forEach(p -> {
        if (p != null && p.getName() != null) perms.add(p.getName());
      });
    }
    return RoleDto.builder()
        .id(r.getId())
        .name(r.getName())
        .permissions(perms)
        .build();
  }
}