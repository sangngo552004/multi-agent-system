package com.tttn.backend_core.exception;

import com.tttn.backend_core.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(value = Exception.class)
  public ResponseEntity<ApiResponse<Object>> handlingRuntimeException(Exception exception) {
    return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatusCode())
        .body(
            ApiResponse.error(
                ErrorCode.UNCATEGORIZED_EXCEPTION.getCode(),
                ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage()));
  }

  @ExceptionHandler(value = AppException.class)
  public ResponseEntity<ApiResponse<Object>> handlingAppException(AppException exception) {
    ErrorCode errorCode = exception.getErrorCode();
    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
  }

  @ExceptionHandler(value = MethodArgumentNotValidException.class)
  public ResponseEntity<ApiResponse<Object>> handlingValidation(
      MethodArgumentNotValidException exception) {
    String enumKey = exception.getFieldError().getDefaultMessage();

    ErrorCode errorCode = ErrorCode.INVALID_KEY;
    try {
      errorCode = ErrorCode.valueOf(enumKey);
    } catch (IllegalArgumentException e) {
      log.warn("Validation message '{}' is not defined in ErrorCode enum", enumKey);
    }

    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
  }
}
