// src/main/java/com/shopmypham/core/exception/UnprocessableException.java
package com.shopmypham.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY) // dự phòng nếu không qua GlobalExceptionHandler
public class UnprocessableException extends RuntimeException {
  public UnprocessableException(String message) { super(message); }
}
