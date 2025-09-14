package com.shopmypham.modules.banner;

import com.shopmypham.core.exception.NotFoundException;
import com.shopmypham.modules.banner.dto.BannerDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service @RequiredArgsConstructor
public class BannerService {
  private final BannerRepository repo;

  @Transactional(readOnly = true)
  public List<BannerDto> publicList(int limit) {
    var list = repo.findAllByOrderBySortOrderAscIdAsc().stream()
        .filter(b -> Boolean.TRUE.equals(b.getActive()))
        .limit(limit <= 0 ? 10 : limit)
        .map(this::toDto).toList();
    return list;
  }

  @Transactional(readOnly = true)
  public List<BannerDto> adminList() {
    return repo.findAllByOrderBySortOrderAscIdAsc().stream().map(this::toDto).toList();
  }

  @Transactional
  public Long create(BannerDto d) {
    Banner b = new Banner();
    b.setTitle(d.getTitle());
    b.setImageUrl(d.getImageUrl());
    b.setPublicId(d.getPublicId());
    b.setLink(d.getLink());
    b.setSortOrder(d.getSortOrder()==null?0:d.getSortOrder());
    b.setActive(d.getActive()==null?true:d.getActive());
    repo.save(b);
    return b.getId();
  }

  @Transactional
  public void update(Long id, BannerDto d) {
    Banner b = repo.findById(id).orElseThrow(() -> new NotFoundException("Banner không tồn tại"));
    if (d.getTitle()!=null) b.setTitle(d.getTitle());
    if (d.getImageUrl()!=null) b.setImageUrl(d.getImageUrl());
    if (d.getPublicId()!=null) b.setPublicId(d.getPublicId());
    if (d.getLink()!=null) b.setLink(d.getLink());
    if (d.getSortOrder()!=null) b.setSortOrder(d.getSortOrder());
    if (d.getActive()!=null) b.setActive(d.getActive());
  }

  @Transactional
  public void delete(Long id) {
    if (!repo.existsById(id)) throw new NotFoundException("Banner không tồn tại");
    repo.deleteById(id);
  }

  private BannerDto toDto(Banner b){
    return BannerDto.builder()
        .id(b.getId()).title(b.getTitle()).imageUrl(b.getImageUrl()).publicId(b.getPublicId())
        .link(b.getLink()).sortOrder(b.getSortOrder()).active(b.getActive()).build();
  }
}
