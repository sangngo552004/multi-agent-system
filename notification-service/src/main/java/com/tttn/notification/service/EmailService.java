package com.tttn.notification.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender javaMailSender;

    public void sendEmail(String to, String subjectTemplate, String bodyTemplate) throws Exception {
        // Simple string replacement for demonstration.
        // In reality, you'd use Thymeleaf or FreeMarker.
        String finalSubject = subjectTemplate;

        // Convert simple line breaks to HTML if needed
        String finalBody = bodyTemplate.replace("\n", "<br>");

        MimeMessage message = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(to);
        helper.setSubject(finalSubject);
        helper.setText(finalBody, true); // true = isHtml

        javaMailSender.send(message);
        log.info("Email sent successfully to {}", to);
    }
}
