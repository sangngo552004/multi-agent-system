package com.tttn.backend_core.service;

import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Slf4j
@Service
public class LocalStorageServiceImpl implements StorageService {

  private final Path fileStorageLocation;

  public LocalStorageServiceImpl(
      @Value("${tttn.storage.local.upload-dir:uploads/}") String uploadDir) {
    this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    try {
      Files.createDirectories(this.fileStorageLocation);
    } catch (Exception ex) {
      throw new RuntimeException(
          "Could not create the directory where the uploaded files will be stored.", ex);
    }
  }

  @Override
  public String uploadFile(MultipartFile file) {
    if (file.isEmpty()) {
      throw new AppException(ErrorCode.INVALID_REQUEST);
    }

    String originalFilename =
        StringUtils.cleanPath(
            file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
    String extension = "";
    int dotIndex = originalFilename.lastIndexOf('.');
    if (dotIndex > 0) {
      extension = originalFilename.substring(dotIndex);
    }

    String newFilename = UUID.randomUUID().toString() + extension;

    try {
      if (newFilename.contains("..")) {
        throw new AppException(ErrorCode.INVALID_REQUEST);
      }

      Path targetLocation = this.fileStorageLocation.resolve(newFilename);
      file.transferTo(targetLocation);

      // Return full URL
      String baseUrl = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
      return baseUrl + "/uploads/" + newFilename;
    } catch (IOException ex) {
      log.error("Could not store file " + newFilename, ex);
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
  }
}
