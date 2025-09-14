package com.shopmypham.core.api;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor
public class ApiResponse<T> {
  private boolean success;
  private String message;
  private T data;
  private java.time.Instant timestamp = java.time.Instant.now();

  public static <T> ApiResponse<T> ok(T data){
    return new ApiResponse<>(true, null, data, java.time.Instant.now());
  }
  public static <T> ApiResponse<T> ok(){
    return ok(null);
  }
  public static <T> ApiResponse<T> error(String msg){
    return new ApiResponse<>(false, msg, null, java.time.Instant.now());
  }
}
