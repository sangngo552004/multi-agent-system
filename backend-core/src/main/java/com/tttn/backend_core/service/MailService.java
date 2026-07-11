package com.tttn.backend_core.service;

import jakarta.annotation.PostConstruct;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

  private final JavaMailSender javaMailSender;

  @Value("${spring.mail.username}")
  private String fromEmail;

  private String emailExistsTemplate;
  private String emailVerificationTemplate;

  @PostConstruct
  public void initTemplates() {
    try {
      emailExistsTemplate = loadTemplate("templates/email-exists.html");
      emailVerificationTemplate = loadTemplate("templates/email-verification.html");
    } catch (IOException e) {
      log.error("Lỗi khi tải template email", e);
    }
  }

  private String loadTemplate(String path) throws IOException {
    ClassPathResource resource = new ClassPathResource(path);
    return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
  }

  public void sendEmailExistsNotification(String toEmail) {
    String subject = "Thông báo: Email đã được sử dụng";
    if (emailExistsTemplate != null) {
      sendHtmlEmail(toEmail, subject, emailExistsTemplate);
    } else {
      log.warn("Không thể gửi email vì template email-exists.html chưa được tải.");
    }
  }

  public void sendVerificationEmail(String toEmail, String token) {
    String subject = "Xác nhận đăng ký tài khoản";
    String verificationUrl = "http://localhost:8080/api/auth/verify?token=" + token;

    if (emailVerificationTemplate != null) {
      String content = emailVerificationTemplate.replace("{{verificationUrl}}", verificationUrl);
      sendHtmlEmail(toEmail, subject, content);
    } else {
      log.warn("Không thể gửi email vì template email-verification.html chưa được tải.");
    }
  }

  private void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
    try {
      MimeMessage message = javaMailSender.createMimeMessage();
      MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

      helper.setFrom(fromEmail);
      helper.setTo(toEmail);
      helper.setSubject(subject);
      helper.setText(htmlContent, true);

      javaMailSender.send(message);
      log.info("Đã gửi email thành công tới {}", toEmail);
    } catch (MessagingException e) {
      log.error("Lỗi khi gửi email tới {}", toEmail, e);
    }
  }
}
