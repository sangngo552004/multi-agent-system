package com.tttn.notification.consumer;

import com.tttn.notification.service.EmailService;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthEmailConsumer {

    private final EmailService emailService;

    private String emailExistsTemplate;
    private String emailVerificationTemplate;

    @PostConstruct
    public void initTemplates() {
        try {
            emailExistsTemplate = loadTemplate("templates/email-exists.html");
            emailVerificationTemplate = loadTemplate("templates/email-verification.html");
        } catch (IOException e) {
            log.error("Lỗi khi tải template email auth", e);
        }
    }

    private String loadTemplate(String path) throws IOException {
        ClassPathResource resource = new ClassPathResource(path);
        return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
    }

    @RabbitListener(queues = "notification.auth.email.queue")
    public void consumeAuthEmailEvent(Map<String, Object> payload) {
        String action = (String) payload.get("action");
        String recipient = (String) payload.get("recipient");

        log.info("Received auth email task for {} (Action: {})", recipient, action);

        try {
            if ("EMAIL_EXISTS".equals(action)) {
                String forgotPasswordUrl = (String) payload.get("forgotPasswordUrl");
                String content = emailExistsTemplate.replace("{{forgotPasswordUrl}}", forgotPasswordUrl);
                emailService.sendEmail(recipient, "Thông báo: Email đã được sử dụng", content);
            } else if ("VERIFY_EMAIL".equals(action)) {
                String verificationUrl = (String) payload.get("verificationUrl");
                String content = emailVerificationTemplate.replace("{{verificationUrl}}", verificationUrl);
                emailService.sendEmail(recipient, "Xác nhận đăng ký tài khoản", content);
            } else {
                log.warn("Unknown auth email action: {}", action);
            }
        } catch (Exception e) {
            log.error("Failed to send auth email to {}: {}", recipient, e.getMessage());
        }
    }
}
