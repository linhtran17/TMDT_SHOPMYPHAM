package com.shopmypham.modules.auth;

import com.shopmypham.modules.auth.dto.PermissionDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service @RequiredArgsConstructor
public class PermissionService {
  private final PermissionRepository repo;

  @Transactional(readOnly = true)
  public List<PermissionDto> list(){
    return repo.findAll(Sort.by("name").ascending())
        .stream().map(PermissionDto::of).toList();
  }
}