// src/main/java/com/shopmypham/modules/auth/dto/SimpleUser.java
package com.shopmypham.modules.auth.dto;

import java.util.Set;

public record SimpleUser(Long id, String fullName, String email, Set<String> roles) {}
