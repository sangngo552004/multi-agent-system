package com.tttn.backend_core.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

  public static final String EMAIL_QUEUE = "notification.email.queue";
  public static final String REPLY_QUEUE = "core.status.reply.queue";
  public static final String APPLICATION_PROCESS_QUEUE = "ai.application.process.request";
  public static final String APPLICATION_EVENT_QUEUE = "ai.application.process.events";
  public static final String AUTH_EMAIL_QUEUE = "notification.auth.email.queue";

  @Bean
  public Queue emailQueue() {
    return new Queue(EMAIL_QUEUE, true); // durable queue
  }

  @Bean
  public Queue replyQueue() {
    return new Queue(REPLY_QUEUE, true); // durable queue
  }

  @Bean
  public Queue applicationProcessQueue() {
    return new Queue(APPLICATION_PROCESS_QUEUE, true);
  }

  @Bean
  public Queue applicationEventQueue() {
    return new Queue(APPLICATION_EVENT_QUEUE, true);
  }

  @Bean
  public Queue authEmailQueue() {
    return new Queue(AUTH_EMAIL_QUEUE, true);
  }

  @Bean
  public MessageConverter jsonMessageConverter() {
    return new Jackson2JsonMessageConverter();
  }
}
