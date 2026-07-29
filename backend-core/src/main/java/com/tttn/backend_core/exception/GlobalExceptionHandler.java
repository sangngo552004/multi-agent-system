package com.tttn.backend_core.exception;

import com.tttn.backend_core.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(value = AccessDeniedException.class)
  public ResponseEntity<ApiResponse<Object>> handlingAccessDenied(AccessDeniedException exception) {
    ErrorCode errorCode = ErrorCode.UNAUTHORIZED;
    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
  }

  @ExceptionHandler(value = Exception.class)
  public ResponseEntity<ApiResponse<Object>> handlingRuntimeException(Exception exception) {
    log.error("Unhandled request exception", exception);
    return ResponseEntity.status(ErrorCode.UNCATEGORIZED_EXCEPTION.getStatusCode())
        .body(
            ApiResponse.error(
                ErrorCode.UNCATEGORIZED_EXCEPTION.getCode(),
                ErrorCode.UNCATEGORIZED_EXCEPTION.getMessage()));
  }

  @ExceptionHandler(
      value = {
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class,
        ServletRequestBindingException.class
      })
  public ResponseEntity<ApiResponse<Object>> handlingInvalidRequest(Exception exception) {
    log.debug("Rejected invalid request ({})", exception.getClass().getSimpleName());
    ErrorCode errorCode = ErrorCode.INVALID_KEY;
    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
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
    ErrorCode errorCode = ErrorCode.INVALID_KEY;
    String enumKey =
        exception.getFieldError() == null ? null : exception.getFieldError().getDefaultMessage();
    if (enumKey != null) {
      try {
        errorCode = ErrorCode.valueOf(enumKey);
      } catch (IllegalArgumentException e) {
        log.warn("Validation message '{}' is not defined in ErrorCode enum", enumKey);
      }
    }

    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
  }

  @ExceptionHandler(value = DataIntegrityViolationException.class)
  public ResponseEntity<ApiResponse<Object>> handlingDataConflict(
      DataIntegrityViolationException exception) {
    ErrorCode errorCode = ErrorCode.DATA_CONFLICT;
    return ResponseEntity.status(errorCode.getStatusCode())
        .body(ApiResponse.error(errorCode.getCode(), errorCode.getMessage()));
  }
}
