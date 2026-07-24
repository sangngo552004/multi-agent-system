package com.tttn.backend_core.config;

import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

  public static final String EMAIL_QUEUE = "notification.email.queue";

  @Bean
  public Queue emailQueue() {
    return new Queue(EMAIL_QUEUE, true); // durable queue
  }
}
