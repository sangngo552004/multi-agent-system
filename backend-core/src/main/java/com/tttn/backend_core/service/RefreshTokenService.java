package com.tttn.backend_core.service;

import com.tttn.backend_core.entity.User;
import io.jsonwebtoken.Claims;
import java.time.Duration;
import java.time.Instant;
import java.util.Set;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenService {

  private static final String TOKEN_PREFIX = "auth:refresh:token:";
  private static final String USER_PREFIX = "auth:refresh:user:";

  private final StringRedisTemplate redisTemplate;

  public RefreshTokenService(StringRedisTemplate redisTemplate) {
    this.redisTemplate = redisTemplate;
  }

  public void store(User user, Claims claims) {
    String tokenId = claims.getId();
    Duration ttl = Duration.between(Instant.now(), claims.getExpiration().toInstant());
    if (tokenId == null || ttl.isNegative() || ttl.isZero()) {
      return;
    }

    redisTemplate.opsForValue().set(tokenKey(tokenId), user.getId().toString(), ttl);
    redisTemplate.opsForSet().add(userKey(user), tokenId);
    redisTemplate.expire(userKey(user), ttl);
  }

  public boolean isActive(User user, Claims claims) {
    String tokenId = claims.getId();
    if (tokenId == null) {
      return false;
    }
    return user.getId().toString().equals(redisTemplate.opsForValue().get(tokenKey(tokenId)));
  }

  public void revoke(User user, Claims claims) {
    String tokenId = claims.getId();
    if (tokenId == null) {
      return;
    }
    redisTemplate.delete(tokenKey(tokenId));
    redisTemplate.opsForSet().remove(userKey(user), tokenId);
  }

  public void revokeAll(User user) {
    String userKey = userKey(user);
    Set<String> tokenIds = redisTemplate.opsForSet().members(userKey);
    if (tokenIds != null && !tokenIds.isEmpty()) {
      redisTemplate.delete(tokenIds.stream().map(this::tokenKey).toList());
    }
    redisTemplate.delete(userKey);
  }

  private String tokenKey(String tokenId) {
    return TOKEN_PREFIX + tokenId;
  }

  private String userKey(User user) {
    return USER_PREFIX + user.getId();
  }
}
