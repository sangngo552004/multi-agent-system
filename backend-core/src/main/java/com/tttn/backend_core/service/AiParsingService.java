package com.tttn.backend_core.service;

import com.tttn.backend_core.dto.request.AiParseRequest;
import com.tttn.backend_core.dto.response.JobParseResponse;
import com.tttn.backend_core.exception.AppException;
import com.tttn.backend_core.exception.ErrorCode;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiParsingService {

  private final RestTemplate restTemplate;

  @Value("${tttn.ai-service.url}")
  private String aiServiceUrl;

  public JobParseResponse parseJd(AiParseRequest request) {
    String url = aiServiceUrl + "/parse-jd";

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    Map<String, String> body = new HashMap<>();
    body.put("text", request.getText());

    HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

    try {
      ResponseEntity<JobParseResponse> response =
          restTemplate.postForEntity(url, entity, JobParseResponse.class);
      if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
        return response.getBody();
      } else {
        log.error("Failed to parse JD. Status code: {}", response.getStatusCode());
        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
      }
    } catch (Exception e) {
      log.error("Error communicating with AI Service: ", e);
      throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
  }
}
