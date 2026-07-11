package com.tttn.backend_core.aspect;

import com.tttn.backend_core.annotation.RateLimit;
import com.tttn.backend_core.annotation.RateLimits;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class RateLimitAspect {

  private final StringRedisTemplate redisTemplate;

  public RateLimitAspect(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  @Before(
      "@annotation(com.tttn.backend_core.annotation.RateLimit) || @annotation(com.tttn.backend_core.annotation.RateLimits)")
  public void checkRateLimit(JoinPoint joinPoint) {
    MethodSignature signature = (MethodSignature) joinPoint.getSignature();

    // Check for @RateLimits container (multiple limits)
    RateLimits rateLimits = signature.getMethod().getAnnotation(RateLimits.class);
    if (rateLimits != null) {
      for (RateLimit limit : rateLimits.value()) {
        enforceLimit(limit);
      }
    } else {
      // Check for single @RateLimit
      RateLimit rateLimit = signature.getMethod().getAnnotation(RateLimit.class);
      if (rateLimit != null) {
        enforceLimit(rateLimit);
      }
    }
  }

  private void enforceLimit(RateLimit rateLimit) {
    ServletRequestAttributes attributes =
        (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
    if (attributes == null) return;

    HttpServletRequest request = attributes.getRequest();
    String ipAddress = request.getRemoteAddr();

    // Generate unique key based on action, IP, and duration window
    String key =
        String.format(
            "rate_limit:%s:%s:%d%s",
            rateLimit.action(), ipAddress, rateLimit.duration(), rateLimit.unit().name());

    Long count = redisTemplate.opsForValue().increment(key);

    if (count != null && count == 1) {
      redisTemplate.expire(key, Duration.of(rateLimit.duration(), rateLimit.unit()));
    }

    if (count != null && count > rateLimit.maxRequests()) {
      throw new AppException(ErrorCode.TOO_MANY_REQUESTS);
    }
  }
}
