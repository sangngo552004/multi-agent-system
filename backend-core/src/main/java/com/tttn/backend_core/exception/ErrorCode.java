package com.tttn.backend_core.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
  UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
  INVALID_KEY(1001, "Invalid request", HttpStatus.BAD_REQUEST),
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
  PEDIGREE_RANK_REQUIRED(1024, "Pedigree rank is required", HttpStatus.BAD_REQUEST),
  USER_STATUS_REQUIRED(1025, "User status is required", HttpStatus.BAD_REQUEST),
  STATUS_REASON_REQUIRED(1026, "A reason is required", HttpStatus.BAD_REQUEST),
  STATUS_REASON_INVALID(
      1027, "Reason must contain between 8 and 240 characters", HttpStatus.BAD_REQUEST),
  USER_SELF_BLOCK_FORBIDDEN(1028, "Administrators cannot block themselves", HttpStatus.CONFLICT),
  JOB_NOT_FOUND(1029, "Job not found", HttpStatus.NOT_FOUND),
  INVALID_REFRESH_TOKEN(1030, "Invalid or expired refresh token", HttpStatus.UNAUTHORIZED),
  KNOWLEDGE_NOT_FOUND(1031, "Knowledge item not found", HttpStatus.NOT_FOUND),
  KNOWLEDGE_NAME_CONFLICT(
      1032, "A knowledge item with this name already exists", HttpStatus.CONFLICT),
  CAREER_RANK_CONFLICT(1033, "This career rank is already in use", HttpStatus.CONFLICT),
  KNOWLEDGE_IN_USE(
      1034,
      "This item is in use. Confirm the forced deactivation to continue",
      HttpStatus.CONFLICT),
  INVALID_KNOWLEDGE_ENTITY(1035, "Invalid knowledge entity", HttpStatus.BAD_REQUEST),
  INVALID_COMPETENCY_LEVELS(
      1036,
      "Exactly five distinct competency levels from 1 to 5 are required",
      HttpStatus.BAD_REQUEST),
  INVALID_APPLICATION_FILTER(1037, "Invalid application filter", HttpStatus.BAD_REQUEST),
  AI_RETRY_NOT_ALLOWED(1038, "The latest AI run cannot be retried", HttpStatus.CONFLICT),
  AI_RUN_ALREADY_ACTIVE(
      1039, "An AI processing run is already active for this application", HttpStatus.CONFLICT),
  IDEMPOTENCY_KEY_REQUIRED(
      1040, "A valid Idempotency-Key header is required", HttpStatus.BAD_REQUEST),
  AI_RUN_NOT_FOUND(1041, "AI processing run not found", HttpStatus.NOT_FOUND),
  DATA_CONFLICT(1042, "Data conflicts with the current state", HttpStatus.CONFLICT),
  INVALID_DASHBOARD_RANGE(
      1043, "Dashboard rangeDays must be either 7 or 30", HttpStatus.BAD_REQUEST),
  INVALID_ADMIN_FILTER(1044, "Invalid admin list filter", HttpStatus.BAD_REQUEST);

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
