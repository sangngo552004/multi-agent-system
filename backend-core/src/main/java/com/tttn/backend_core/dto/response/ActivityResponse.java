package com.tttn.backend_core.dto.response;

import com.tttn.backend_core.entity.ActivityKind;
import com.tttn.backend_core.entity.ActivitySource;
import com.tttn.backend_core.entity.ActivityTargetType;
import java.time.LocalDateTime;
import java.util.UUID;

public record ActivityResponse(
    UUID id,
    ActivityKind kind,
    ActivitySource source,
    String actorName,
    String description,
    ActivityTargetType targetType,
    UUID targetId,
    String targetLabel,
    String targetHref,
    LocalDateTime createdAt) {}
