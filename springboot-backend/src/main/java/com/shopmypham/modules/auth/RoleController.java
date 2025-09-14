package com.shopmypham.modules.auth;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.auth.dto.RoleDto;
import com.shopmypham.modules.auth.dto.RoleUpsertRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

  private final RoleService roleService;

  @GetMapping
  @PreAuthorize("hasRole('ADMIN') or hasAuthority('user:read')")
  public ApiResponse<List<RoleDto>> list() { return ApiResponse.ok(roleService.list()); }

  @GetMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN') or hasAuthority('user:read')")
  public ApiResponse<RoleDto> get(@PathVariable Long id) { return ApiResponse.ok(roleService.get(id)); }

  @PostMapping
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Long> create(@RequestBody @Valid RoleUpsertRequest req) { return ApiResponse.ok(roleService.create(req)); }

  @PutMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody @Valid RoleUpsertRequest req) {
    roleService.update(id, req); return ApiResponse.ok();
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id) { roleService.delete(id); return ApiResponse.ok(); }
}
