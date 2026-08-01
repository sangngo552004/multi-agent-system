package com.tttn.backend_core.service;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {
  /** Uploads a file and returns the public URL to access it. */
  String uploadFile(MultipartFile file);
}
