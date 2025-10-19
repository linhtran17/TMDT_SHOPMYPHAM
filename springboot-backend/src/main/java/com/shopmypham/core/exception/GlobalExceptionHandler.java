// src/main/java/com/shopmypham/core/exception/GlobalExceptionHandler.java
package com.shopmypham.core.exception;

import com.shopmypham.core.api.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  // 401
  @ExceptionHandler({ BadCredentialsException.class, UsernameNotFoundException.class, AuthenticationException.class })
  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  public ApiResponse<?> handleAuth(Exception ex) {
    return ApiResponse.error("Email hoặc mật khẩu không đúng");
  }

  // 403
  @ExceptionHandler({
      org.springframework.security.access.AccessDeniedException.class,
      org.springframework.security.authorization.AuthorizationDeniedException.class
  })
  public ResponseEntity<ApiResponse<Void>> handleAccessDenied(Exception ex) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ApiResponse.error("Access denied"));
  }

  // 400: @Valid body
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<?> handleValidation(MethodArgumentNotValidException ex) {
    var msg = ex.getBindingResult().getFieldErrors().stream()
        .map(e -> e.getField() + ": " + e.getDefaultMessage())
        .findFirst().orElse("Dữ liệu không hợp lệ");
    return ApiResponse.error(msg);
  }

  // 400: bind/query/path, sai kiểu tham số, IllegalArgument
  @ExceptionHandler({ BindException.class, MethodArgumentTypeMismatchException.class, IllegalArgumentException.class })
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<?> handleBadInputs(Exception ex) {
    return ApiResponse.error(ex.getMessage() == null ? "Dữ liệu không hợp lệ" : ex.getMessage());
  }

  // 400: ApiException
  @ExceptionHandler(ApiException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<?> handleApi(ApiException ex) {
    return ApiResponse.error(ex.getMessage());
  }

  // 400: BadRequest
  @ExceptionHandler(BadRequestException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public ApiResponse<?> handleBadRequest(BadRequestException ex) {
    return ApiResponse.error(ex.getMessage());
  }

  // 404
  @ExceptionHandler(NotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public ApiResponse<?> handleNotFound(NotFoundException ex) {
    return ApiResponse.error(ex.getMessage());
  }

  // 400: vi phạm ràng buộc dữ liệu (FK,) ở tầng Spring DAO
  @ExceptionHandler(DataIntegrityViolationException.class)
  public ResponseEntity<ApiResponse<Void>> handleFK(DataIntegrityViolationException ex){
    return ResponseEntity.badRequest()
        .body(ApiResponse.error("Danh mục đang được tham chiếu, không thể xoá"));
  }

  // 409: xung đột dữ liệu ở tầng Hibernate/DB
  @ExceptionHandler({
      org.hibernate.exception.ConstraintViolationException.class,
      jakarta.validation.ConstraintViolationException.class,
      java.sql.SQLIntegrityConstraintViolationException.class
  })
  public ResponseEntity<ApiResponse<Void>> handleConstraintLike(Exception ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(ApiResponse.error("Xung đột dữ liệu"));
  }

  // 422: rule nghiệp vụ không thoả (Unprocessable Entity)
@ExceptionHandler(UnprocessableException.class)
public ResponseEntity<ApiResponse<Void>> handleUnprocessable(UnprocessableException ex) {
  return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
      .body(ApiResponse.error(ex.getMessage()));
}

  // 500: Fallback DUY NHẤT
  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiResponse<Void>> handleOther(Exception ex) {
    log.error("Unhandled error", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ApiResponse.error("Server error"));
  }
}
