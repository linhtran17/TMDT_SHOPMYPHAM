package com.shopmypham.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleUpsertRequest {
  @NotBlank
  @Size(max = 100)
  private String name;

  private Set<String> permissions;
}
