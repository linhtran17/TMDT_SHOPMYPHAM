package com.shopmypham.modules.category;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

  Optional<Category> findBySlug(String slug);

  // THÊM: để ChatService có thể tìm theo cụm từ trong tên (không phân biệt hoa thường)
  Optional<Category> findTop1ByNameIgnoreCaseContaining(String namePart);

  Optional<Category> findByName(String name);
  Optional<Category> findTop1BySlugIgnoreCase(String slug);

  boolean existsByName(String name);

  boolean existsByParentId(Long parentId);

  default List<Category> findAllOrderByName() {
    return findAll(Sort.by("name").ascending());
  }

  @Query("select c.parentId, count(c) from Category c where c.parentId in :ids group by c.parentId")
  List<Object[]> countChildrenByParentIds(@Param("ids") List<Long> ids);

  
  default List<Category> findAllActiveSorted() {
    return findAll(Sort.by(Sort.Order.asc("sortOrder"), Sort.Order.asc("name")));
  }
}
