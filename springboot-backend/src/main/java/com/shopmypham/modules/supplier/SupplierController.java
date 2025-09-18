package com.shopmypham.modules.supplier;

import com.shopmypham.core.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {
  private final SupplierService service;

  // GET /api/suppliers?q=&page=&size=
  @GetMapping
  public ApiResponse<?> search(@RequestParam(required = false) String q,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "12") int size) {
    return ApiResponse.ok(service.search(q, page, size));
  }

  @GetMapping("/{id}")
  public ApiResponse<?> get(@PathVariable Long id){
    return ApiResponse.ok(service.get(id));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('supplier:write')")
  public ApiResponse<?> create(@RequestBody Supplier body){
    return ApiResponse.ok(service.create(body));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('supplier:write')")
  public ApiResponse<?> update(@PathVariable Long id, @RequestBody Supplier body){
    service.update(id, body);
    return ApiResponse.ok();
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('supplier:write')")
  public ApiResponse<?> delete(@PathVariable Long id){
    service.delete(id);
    return ApiResponse.ok();
  }
}
