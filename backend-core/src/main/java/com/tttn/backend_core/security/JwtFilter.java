package com.tttn.backend_core.security;

import com.tttn.backend_core.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtFilter extends OncePerRequestFilter {

  private final JwtUtils jwtUtils;
  private final UserRepository userRepository;

  public JwtFilter(JwtUtils jwtUtils, UserRepository userRepository) {
    this.jwtUtils = jwtUtils;
    this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    final String authHeader = request.getHeader("Authorization");
    String jwt = null;

    if (authHeader != null && authHeader.startsWith("Bearer ")) {
      jwt = authHeader.substring(7);
      try {
        Claims claims = jwtUtils.parseClaims(jwt);
        String type = claims.get("type", String.class);

        if ("ACCESS".equals(type)) {
          String email = claims.getSubject();
          if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            userRepository
                .findByEmail(email)
                .filter(user -> user.isActive())
                .ifPresent(
                    user -> {
                      String role = "ROLE_" + user.getRole().name();
                      CustomUserPrincipal principal =
                          new CustomUserPrincipal(user.getId(), role, user.getEmail());
                      UsernamePasswordAuthenticationToken authToken =
                          new UsernamePasswordAuthenticationToken(
                              principal, null, List.of(new SimpleGrantedAuthority(role)));
                      authToken.setDetails(
                          new WebAuthenticationDetailsSource().buildDetails(request));
                      SecurityContextHolder.getContext().setAuthentication(authToken);
                    });
          }
        }
      } catch (Exception e) {
        request.setAttribute("jwtException", e);
      }
    }

    filterChain.doFilter(request, response);
  }
}
