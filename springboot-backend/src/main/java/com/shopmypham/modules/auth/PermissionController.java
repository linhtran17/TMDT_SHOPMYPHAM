package com.shopmypham.modules.auth;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.auth.dto.PermissionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
public class PermissionController {
  private final PermissionService service;

  @GetMapping
  @PreAuthorize("hasRole('ADMIN') or hasAuthority('user:read')")
  public ApiResponse<List<PermissionDto>> list(){
    return ApiResponse.ok(service.list());
  }
}