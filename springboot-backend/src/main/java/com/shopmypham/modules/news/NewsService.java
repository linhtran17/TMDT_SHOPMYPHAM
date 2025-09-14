package com.shopmypham.modules.news;

import com.shopmypham.core.exception.BadRequestException;
import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.news.dto.NewsDto;
import com.shopmypham.modules.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import static com.shopmypham.modules.news.NewsMapper.apply;

@Service
@RequiredArgsConstructor
public class NewsService {
  private final NewsRepository repo;
  private final UserRepository userRepo;

  // ===== PUBLIC =====
  @Transactional(readOnly = true)
  public List<NewsDto> publicList(int limit) {
    return repo.findTop50ByActiveTrueOrderByPublishedAtDesc()
        .stream()
        .limit(Math.max(1, limit))
        .map(NewsMapper::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public NewsDto publicGet(String slug) {
    return repo.findBySlug(slug)
        .filter(n -> Boolean.TRUE.equals(n.getActive()))
        .map(NewsMapper::toDto)
        .orElseThrow(() -> new NotFoundException("Bài viết không tồn tại"));
  }

  // ===== ADMIN =====
  @Transactional(readOnly = true)
  public List<NewsDto> adminList() {
    return repo.findAll().stream()
        .sorted(Comparator.comparing(News::getPublishedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
        .map(NewsMapper::toDto)
        .toList();
  }

  @Transactional
  public Long create(NewsDto dto, String currentEmail) {
    validateTitle(dto.getTitle());
    String slug = makeSlug(dto.getSlug(), dto.getTitle());
    if (repo.existsBySlug(slug)) throw new BadRequestException("Slug đã tồn tại");

    var author = userRepo.findByEmail(currentEmail)
        .orElseThrow(() -> new BadRequestException("Không xác định được tác giả"));

    var n = new News();
    dto.setSlug(slug);
    apply(n, dto);
    n.setAuthor(author);
    return repo.save(n).getId();
  }

  @Transactional
  public void update(Long id, NewsDto dto) {
    var n = repo.findById(id).orElseThrow(() -> new NotFoundException("Không tìm thấy bài viết"));
    if (dto.getTitle() != null) validateTitle(dto.getTitle());

    String slug = makeSlug(dto.getSlug(), dto.getTitle() != null ? dto.getTitle() : n.getTitle());
    if (repo.existsBySlugAndIdNot(slug, id)) throw new BadRequestException("Slug đã tồn tại");

    dto.setSlug(slug);
    apply(n, dto);
    repo.save(n);
  }

  @Transactional
  public void delete(Long id) {
    if (!repo.existsById(id)) throw new NotFoundException("Không tìm thấy bài viết");
    repo.deleteById(id);
  }

  // ===== Helpers =====
  private static void validateTitle(String title) {
    if (title == null || title.isBlank()) throw new BadRequestException("Tiêu đề không được trống");
  }

  private static String slugify(String s) {
    if (s == null) return "";
    return Normalizer.normalize(s, Normalizer.Form.NFD)
        .replaceAll("\\p{M}", "")
        .toLowerCase(Locale.ROOT)
        .replaceAll("[^a-z0-9\\s-]", "")
        .replaceAll("\\s+", "-")
        .replaceAll("-{2,}", "-")
        .replaceAll("^-|-$", "");
  }

  private static String makeSlug(String slug, String fallbackTitle) {
    String base = slug != null && !slug.isBlank() ? slug : fallbackTitle;
    String out = slugify(base);
    return out.isBlank() ? "news-" + System.currentTimeMillis() : out;
  }
}
