package com.tttn.backend_core.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

  @Value("${tttn.storage.local.upload-dir:uploads/}")
  private String uploadDir;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // Map requests to /uploads/** to the local upload-dir
    registry
        .addResourceHandler("/uploads/**")
        .addResourceLocations("file:" + uploadDir + (uploadDir.endsWith("/") ? "" : "/"));
  }
}
