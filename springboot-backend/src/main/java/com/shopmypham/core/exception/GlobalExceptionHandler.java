package com.shopmypham.core.exception;
import com.shopmypham.core.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(NotFoundException.class)
  public ResponseEntity<?> nf(NotFoundException ex){
    return ResponseEntity.status(404).body(new ApiResponse<>(false,null,ex.getMessage()));
  }
  @ExceptionHandler(BadRequestException.class)
  public ResponseEntity<?> br(BadRequestException ex){
    return ResponseEntity.badRequest().body(new ApiResponse<>(false,null,ex.getMessage()));
  }
  @ExceptionHandler(Exception.class)
  public ResponseEntity<?> other(Exception ex){
    return ResponseEntity.internalServerError().body(new ApiResponse<>(false,null,"Internal error"));
  }
}
