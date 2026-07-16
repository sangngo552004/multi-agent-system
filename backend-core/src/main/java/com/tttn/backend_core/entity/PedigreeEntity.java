package com.tttn.backend_core.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Đại diện cho một tổ chức (trường đại học, công ty, agency) có thể được xếp hạng và dùng trong
 * Institutional Rules của Matcher Agent.
 *
 * <p>Thay thế hoàn toàn danh sách hardcode trong knowledge_base.py của AI Service. AI Service sẽ
 * đọc dữ liệu này qua API thay vì hardcode.
 */
@Entity
@Table(name = "pedigree_entities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PedigreeEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  /** Tên tổ chức, ví dụ: "Đại học Bách Khoa", "VNG Corporation". */
  @Column(nullable = false)
  private String name;

  /** Loại tổ chức: UNIVERSITY, COMPANY, AGENCY. */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private PedigreeType type;

  /**
   * Hạng của tổ chức: INTERNATIONAL, TIER_1, TIER_2, TIER_3. Thay vì binary (Tier 1 vs Other), hệ
   * thống hỗ trợ phân loại 4 bậc.
   *
   * <p>INTERNATIONAL: RMIT, Oxford, MIT, ... TIER_1: Bách Khoa, VNG, Shopee, ... TIER_2: ĐH Quốc
   * gia HCM, VNPAY, ... TIER_3: Các trường/công ty còn lại có thương hiệu
   */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 50)
  private PedigreeRank rank;

  /**
   * Domain liên quan, dùng để lọc khi áp dụng rule. Ví dụ: "ENGINEERING", "SALES_MARKETING",
   * "FINANCE", "ALL". Giá trị "ALL" nghĩa là áp dụng cho mọi domain.
   */
  @Column(nullable = false, length = 100)
  @Builder.Default
  private String domain = "ALL";

  /** Quốc gia, mặc định Việt Nam. */
  @Column(nullable = false, length = 10)
  @Builder.Default
  private String country = "VN";

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private Boolean isActive = true;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;
}
