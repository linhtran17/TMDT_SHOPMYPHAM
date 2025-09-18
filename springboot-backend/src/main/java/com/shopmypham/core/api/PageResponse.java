package com.shopmypham.core.api;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data @AllArgsConstructor
public class PageResponse<T> {
  private List<T> items;
  private long total;
  private int page;
  private int size;
} 
