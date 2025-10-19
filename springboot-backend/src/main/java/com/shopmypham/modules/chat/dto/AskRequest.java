package com.shopmypham.modules.chat.dto;

import java.util.List;


public class AskRequest {
  private String message;
  private Integer topKProducts;
  private Integer priceMin;
  private Integer priceMax;
  private Long categoryId;
  private String catSlug;
  private List<Long> childIds;

  // getters/setters
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }

  public Integer getTopKProducts() { return topKProducts; }
  public void setTopKProducts(Integer topKProducts) { this.topKProducts = topKProducts; }

  public Integer getPriceMin() { return priceMin; }
  public void setPriceMin(Integer priceMin) { this.priceMin = priceMin; }

  public Integer getPriceMax() { return priceMax; }
  public void setPriceMax(Integer priceMax) { this.priceMax = priceMax; }

  public Long getCategoryId() { return categoryId; }
  public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }

  public String getCatSlug() { return catSlug; }
  public void setCatSlug(String catSlug) { this.catSlug = catSlug; }

  public List<Long> getChildIds() { return childIds; }
  public void setChildIds(List<Long> childIds) { this.childIds = childIds; }
}
