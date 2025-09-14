package com.shopmypham.modules.auth.dto;

import java.util.Set;

public record CurrentUserDto(
    Long id,
    String fullName,
    String email,
    Set<String> roles,
    Set<String> authorities
) {}
