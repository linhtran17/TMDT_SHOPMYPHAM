package com.shopmypham.modules.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.shopmypham.core.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {

  private final Cloudinary cloudinary;
  private final CloudinaryProperties props;

  public UploadResult upload(MultipartFile file, String folder) {
    try (InputStream in = file.getInputStream()) {
      final String root = nvl(props.rootFolder());
      final String sub  = sanitize(folder);
      final String ff   = joinPath(root, sub); // null nếu rỗng

      @SuppressWarnings("unchecked")
      Map<String, Object> res = (Map<String, Object>) cloudinary.uploader().upload(
          in.readAllBytes(),
          ObjectUtils.asMap(
              "folder", ff,
              "resource_type", "image",
              "unique_filename", true,
              "overwrite", false,
              "quality", "auto"
          )
      );

      return UploadResult.from(res);
    } catch (Exception e) {
      log.error("Cloudinary upload failed: {}", e.getMessage(), e);
      throw new BadRequestException("Cloudinary upload failed: " + e.getMessage());
    }
  }

  public void deleteByPublicId(String publicId) {
    if (publicId == null || publicId.isBlank()) return;
    try {
      cloudinary.uploader().destroy(publicId.trim(), ObjectUtils.asMap(
          "resource_type", "image",
          "invalidate", true
      ));
    } catch (Exception e) {
      log.error("Cloudinary destroy failed [{}]: {}", publicId, e.getMessage(), e);
      throw new BadRequestException("Cloudinary delete failed: " + e.getMessage());
    }
  }

  public record UploadResult(
      String url,
      String secureUrl,
      String publicId,
      String format,
      long bytes,
      Integer width,
      Integer height
  ) {
    static UploadResult from(Map<String, Object> m) {
      return new UploadResult(
          (String)  m.getOrDefault("url", ""),
          (String)  m.getOrDefault("secure_url", ""),
          (String)  m.getOrDefault("public_id", ""),
          (String)  m.getOrDefault("format", ""),
          ((Number) m.getOrDefault("bytes", 0)).longValue(),
          (Integer) m.getOrDefault("width", null),
          (Integer) m.getOrDefault("height", null)
      );
    }
  }

  private static String nvl(String s) { return s == null ? "" : s.trim(); }

  /** chỉ giữ [a-z0-9/_-], gộp //, bỏ / đầu/đuôi */
  private static String sanitize(String input) {
    if (input == null) return "";
    String f = input.trim().toLowerCase()
        .replace('\\', '/')
        .replaceAll("\\.\\.+", "")
        .replaceAll("[^a-z0-9_\\-/]", "")
        .replaceAll("/{2,}", "/")
        .replaceAll("^/|/$", "");
    return f.length() > 120 ? f.substring(0, 120) : f;
  }

  /** nối path an toàn, trả null nếu rỗng */
  private static String joinPath(String a, String b) {
    String left = sanitize(a), right = sanitize(b);
    String joined = (left.isEmpty() ? right : (right.isEmpty() ? left : left + "/" + right));
    return joined.isEmpty() ? null : joined;
  }
}
