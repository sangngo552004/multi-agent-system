package com.tttn.backend_core.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
  UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
  INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
  USER_EXISTED(1002, "User already existed", HttpStatus.BAD_REQUEST),
  USER_NOT_FOUND(1003, "User not found", HttpStatus.NOT_FOUND),
  UNAUTHENTICATED(1004, "Invalid email or password", HttpStatus.UNAUTHORIZED),
  UNAUTHORIZED(1005, "You do not have permission", HttpStatus.FORBIDDEN),
  INVALID_PASSWORD(1006, "Password must be at least 8 characters", HttpStatus.BAD_REQUEST),
  INVALID_EMAIL(1007, "Invalid email format", HttpStatus.BAD_REQUEST),
  EMAIL_REQUIRED(1008, "Email is required", HttpStatus.BAD_REQUEST),
  PASSWORD_REQUIRED(1009, "Password is required", HttpStatus.BAD_REQUEST),
  FULL_NAME_REQUIRED(1010, "Full name is required", HttpStatus.BAD_REQUEST),
  ROLE_REQUIRED(1011, "Role is required", HttpStatus.BAD_REQUEST),
  ACCOUNT_LOCKED(
      1012, "Account is locked due to too many failed login attempts", HttpStatus.FORBIDDEN),
  ACCOUNT_INACTIVE(1013, "Account is inactive", HttpStatus.FORBIDDEN),
  WEAK_PASSWORD(1014, "Password is too weak", HttpStatus.BAD_REQUEST),
  TOO_MANY_REQUESTS(
      1015, "Too many requests. Please try again later.", HttpStatus.TOO_MANY_REQUESTS),
  INVALID_TOKEN(1016, "Invalid or expired token", HttpStatus.BAD_REQUEST),
  APPLICATION_NOT_FOUND(1017, "Application not found", HttpStatus.NOT_FOUND),
  EMPTY_APPLICATION_IDS(1018, "Application IDs list cannot be empty", HttpStatus.BAD_REQUEST),
  INVALID_ACTION(1019, "Action must be INVITE or REJECT", HttpStatus.BAD_REQUEST),
  SUBJECT_TEMPLATE_REQUIRED(1020, "Subject template is required", HttpStatus.BAD_REQUEST),
  BODY_TEMPLATE_REQUIRED(1021, "Body template is required", HttpStatus.BAD_REQUEST),
  ORGANIZATION_NAME_REQUIRED(1022, "Organization name is required", HttpStatus.BAD_REQUEST),
  ORGANIZATION_TYPE_REQUIRED(1023, "Organization type is required", HttpStatus.BAD_REQUEST),
  PEDIGREE_RANK_REQUIRED(1024, "Pedigree rank is required", HttpStatus.BAD_REQUEST);

  private final int code;
  private final String message;
  private final HttpStatus statusCode;

  ErrorCode(int code, String message, HttpStatus statusCode) {
    this.code = code;
    this.message = message;
    this.statusCode = statusCode;
  }

  public int getCode() {
    return code;
  }

  public String getMessage() {
    return message;
  }

  public HttpStatus getStatusCode() {
    return statusCode;
  }
}
