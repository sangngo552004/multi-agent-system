package com.tttn.backend_core.controller;

import com.tttn.backend_core.dto.response.AiMasterDataResponse;
import com.tttn.backend_core.dto.response.ApiResponse;
import com.tttn.backend_core.service.AiMasterDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiMasterDataController {

  private final AiMasterDataService aiMasterDataService;

  @GetMapping("/master-data")
  public ApiResponse<AiMasterDataResponse> getMasterData() {
    return ApiResponse.success(aiMasterDataService.getMasterData());
  }
}
