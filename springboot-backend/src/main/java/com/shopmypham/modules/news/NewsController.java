package com.shopmypham.modules.news;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.modules.news.dto.NewsDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {
  private final NewsService service;

  // ===== PUBLIC =====
  @GetMapping("/public")
  public ApiResponse<List<NewsDto>> publicList(@RequestParam(defaultValue = "6") int limit) {
    return ApiResponse.ok(service.publicList(limit));
  }

  @GetMapping("/public/{slug}")
  public ApiResponse<NewsDto> publicGet(@PathVariable String slug) {
    return ApiResponse.ok(service.publicGet(slug));
  }

  // ===== ADMIN =====
  @GetMapping
  @PreAuthorize("hasAuthority('news:read')")
  public ApiResponse<List<NewsDto>> adminList() {
    return ApiResponse.ok(service.adminList());
  }

  @PostMapping
  @PreAuthorize("hasAuthority('news:create')")
  public ApiResponse<Long> create(Authentication auth, @RequestBody NewsDto dto) {
    return ApiResponse.ok(service.create(dto, auth.getName()));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('news:update')")
  public ApiResponse<Void> update(@PathVariable Long id, @RequestBody NewsDto dto) {
    service.update(id, dto);
    return ApiResponse.ok();
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('news:delete')")
  public ApiResponse<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ApiResponse.ok();
  }
}
