package com.tttn.backend_core.service;

import com.tttn.backend_core.config.RabbitMQConfig;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

  private final RabbitTemplate rabbitTemplate;

  @Value("${app.base-url:http://localhost:8080}")
  private String appBaseUrl;

  @Value("${app.frontend-url:http://localhost:3000}")
  private String frontendUrl;

  public void sendEmailExistsNotification(String toEmail) {
    String forgotPasswordUrl = appBaseUrl + "/api/auth/forgot-password";

    Map<String, Object> payload = new HashMap<>();
    payload.put("action", "EMAIL_EXISTS");
    payload.put("recipient", toEmail);
    payload.put("forgotPasswordUrl", forgotPasswordUrl);

    rabbitTemplate.convertAndSend(RabbitMQConfig.AUTH_EMAIL_QUEUE, payload);
    log.info("Đã gửi sự kiện EMAIL_EXISTS cho {} tới RabbitMQ", toEmail);
  }

  public void sendVerificationEmail(String toEmail, String token) {
    String verificationUrl = frontendUrl + "/vi/verify?token=" + token;

    Map<String, Object> payload = new HashMap<>();
    payload.put("action", "VERIFY_EMAIL");
    payload.put("recipient", toEmail);
    payload.put("verificationUrl", verificationUrl);

    rabbitTemplate.convertAndSend(RabbitMQConfig.AUTH_EMAIL_QUEUE, payload);
    log.info("Đã gửi sự kiện VERIFY_EMAIL cho {} tới RabbitMQ", toEmail);
  }
}
