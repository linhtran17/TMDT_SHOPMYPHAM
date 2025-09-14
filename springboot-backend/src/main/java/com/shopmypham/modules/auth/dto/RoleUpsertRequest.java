package com.shopmypham.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Set;

public record RoleUpsertRequest(
    @NotBlank @Size(max = 100) String name,
    Set<String> permissions   // ví dụ: "product:read"
) {}
