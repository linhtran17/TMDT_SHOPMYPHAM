package com.shopmypham.modules.storage;

import com.shopmypham.core.api.ApiResponse;
import com.shopmypham.core.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
public class UploadController {

  private final FileStorageService storage;

  // endpoint “mới”
  @PostMapping(path = "/api/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAuthority('media:upload')")
  public ApiResponse<FileStorageService.UploadResult> upload(
      @RequestPart("file") MultipartFile file,
      @RequestParam(value = "folder", required = false) String folder) {

    if (file == null || file.isEmpty()) throw new BadRequestException("File rỗng");
    String ct = (file.getContentType() == null ? "" : file.getContentType().toLowerCase());
    if (!ct.startsWith("image/")) throw new BadRequestException("Chỉ hỗ trợ upload ảnh");

    return ApiResponse.ok(storage.upload(file, sanitizeFolder(folder)));
  }

  // alias để không phải sửa FE nếu đang gọi /api/storage/upload
  @PostMapping(path = "/api/storage/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAuthority('media:upload')")
  public ApiResponse<FileStorageService.UploadResult> uploadAlias(
      @RequestPart("file") MultipartFile file,
      @RequestParam(value = "folder", required = false) String folder) {
    return upload(file, folder);
  }

  @DeleteMapping("/api/upload")
  @PreAuthorize("hasAuthority('media:delete')")
  public ApiResponse<Void> delete(@RequestParam("publicId") String publicId) {
    if (!StringUtils.hasText(publicId)) throw new BadRequestException("Thiếu publicId");
    storage.deleteByPublicId(publicId.trim());
    return ApiResponse.ok();
  }

  private String sanitizeFolder(String input) {
    String f = (input == null ? "" : input).trim().toLowerCase();
    f = f.replace('\\', '/')
         .replaceAll("\\.\\.+", "")
         .replaceAll("[^a-z0-9_\\-/]", "")
         .replaceAll("/{2,}", "/")
         .replaceAll("^/|/$", "");
    if (f.isBlank()) f = "misc";
    if (f.length() > 120) f = f.substring(0, 120);
    return f;
  }
}
