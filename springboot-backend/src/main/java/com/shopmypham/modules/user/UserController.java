package com.shopmypham.modules.user;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.auth.Role;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
  private final UserService service;

  @Data static class CreateReq {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private String address;
    private String avatarUrl;
    private Boolean enabled;
    private Set<Long> roleIds;
  }
  @Data static class UpdateReq {
    private String fullName;
    private String email;
    private String password;
    private String phone;
    private String address;
    private String avatarUrl;
    private Boolean enabled;
    private Set<Long> roleIds;
  }
  @Data static class UserRes {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String avatarUrl;
    private Boolean enabled;
    private List<String> roles;
    private Instant createdAt;
    private Instant updatedAt;
  }
  private static UserRes toRes(User u) {
    var r = new UserRes();
    r.setId(u.getId());
    r.setFullName(u.getFullName());
    r.setEmail(u.getEmail());
    r.setPhone(u.getPhone());
    r.setAddress(u.getAddress());
    r.setAvatarUrl(u.getAvatarUrl());
    r.setEnabled(u.getEnabled());
    r.setCreatedAt(u.getCreatedAt());
    r.setUpdatedAt(u.getUpdatedAt());
    r.setRoles(u.getRoles().stream().map(Role::getName).toList());
    return r;
  }

  @GetMapping
  @PreAuthorize("hasAuthority('user:read') or hasRole('ADMIN')")
  public ApiResponse<Page<UserRes>> page(
      @RequestParam(required = false) String q,
      @RequestParam(required = false) Boolean enabled,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "12") int size
  ) {
    var pg = service.page(q, enabled, page, size).map(UserController::toRes);
    return ApiResponse.ok(pg);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAuthority('user:read') or hasRole('ADMIN')")
  public ApiResponse<UserRes> get(@PathVariable Long id){
    return ApiResponse.ok(toRes(service.get(id)));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('user:create') or hasRole('ADMIN')")
  public ApiResponse<Long> create(@RequestBody CreateReq req){
    var id = service.create(req.getFullName(), req.getEmail(), req.getPassword(),
        req.getPhone(), req.getAddress(), req.getAvatarUrl(), req.getEnabled(), req.getRoleIds());
    return ApiResponse.ok(id);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('user:update') or hasRole('ADMIN')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody UpdateReq req){
    service.update(id, req.getFullName(), req.getEmail(), req.getPassword(),
        req.getPhone(), req.getAddress(), req.getAvatarUrl(), req.getEnabled(), req.getRoleIds());
    return ApiResponse.ok();
  }

  // ✅ PATCH nhận body JSON { "enabled": true }
  @PatchMapping("/{id}/enabled")
  @PreAuthorize("hasAuthority('user:update') or hasRole('ADMIN')")
  public ApiResponse<Void> toggle(@PathVariable Long id, @RequestBody Map<String, Object> body){
    boolean value = Boolean.TRUE.equals(body.get("enabled"));
    service.toggleEnable(id, value);
    return ApiResponse.ok();
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('user:delete') or hasRole('ADMIN')")
  public ApiResponse<Void> delete(@PathVariable Long id){
    service.delete(id);
    return ApiResponse.ok();
  }
}
