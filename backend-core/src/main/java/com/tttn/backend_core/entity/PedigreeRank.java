package com.tttn.backend_core.entity;

/**
 * Xếp hạng uy tín của một tổ chức (trường/công ty).
 *
 * <p>Thứ tự ưu tiên giảm dần: INTERNATIONAL > TIER_1 > TIER_2 > TIER_3
 *
 * <p>Mỗi rank tương ứng với một hệ số điểm bonus trong Scoring Engine: INTERNATIONAL → 1.0 TIER_1 →
 * 0.8 TIER_2 → 0.5 TIER_3 → 0.2
 */
public enum PedigreeRank {
  INTERNATIONAL,
  TIER_1,
  TIER_2,
  TIER_3
}
