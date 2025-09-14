// Xóa các record và chỉ dùng class
package com.shopmypham.modules.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @Email @NotBlank private String email;
    @NotBlank private String password;
}