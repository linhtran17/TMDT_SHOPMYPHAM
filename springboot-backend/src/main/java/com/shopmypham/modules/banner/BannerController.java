package com.shopmypham.modules.banner;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.banner.dto.BannerDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/banners")
@RequiredArgsConstructor
public class BannerController {
  private final BannerService service;

  // Public cho FE
  @GetMapping("/public")
  public ApiResponse<List<BannerDto>> publicList(@RequestParam(defaultValue = "6") int limit) {
    return ApiResponse.ok(service.publicList(limit));
  }

  // Admin
  @GetMapping
  @PreAuthorize("hasAuthority('banner:read')")
  public ApiResponse<List<BannerDto>> adminList() {
    return ApiResponse.ok(service.adminList());
  }

  @PostMapping
  @PreAuthorize("hasAuthority('banner:create')")
  public ApiResponse<Long> create(@Valid @RequestBody BannerDto dto) {
    return ApiResponse.ok(service.create(dto));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('banner:update')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody BannerDto dto) {
    service.update(id, dto); return ApiResponse.ok();
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('banner:delete')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id); return ApiResponse.ok();
  }
}
