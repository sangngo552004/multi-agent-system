"""
Deterministic Scoring Engine cho hệ thống Competency-Based Evaluation.

Thay đổi so với version cũ:
1. CONFIDENCE_SCORE_MAP rõ ràng thay vì magic number 0.5
2. Logic confidence phân biệt 4 trường hợp (meets+HIGH, meets+MEDIUM, fails+MEDIUM, fails+LOW)
3. Institutional Rules dùng max_impact_percent từ rule config thay vì hardcode 0.2
4. Hỗ trợ đa bậc pedigree (INTERNATIONAL/TIER_1/TIER_2/TIER_3) với hệ số khác nhau
5. Trả về ScoringBreakdown chi tiết (audit trail) cùng với scores
"""

import logging
from typing import Optional

from app.agents.matcher_agent import knowledge_base
from app.core.schemas import (
    CompetencyEvidence,
    CompetencyScoreDetail,
    JobConfiguration,
    RuleTriggered,
    ScoringBreakdown,
)

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Bảng hệ số confidence — thay thế magic number 0.5 cũ
#
# Key: (meets_requirement: bool, confidence: str)
# Value: hệ số nhân vào weight (0.0 – 1.0)
#
# Giải thích logic:
#   - meets=True,  HIGH:   Đạt rõ ràng                  → 100%
#   - meets=True,  MEDIUM: Đạt nhưng LLM không chắc      → 80% (ưu ái ứng viên)
#   - meets=False, MEDIUM: Không đạt nhưng có ít bằng chứng → 30% (partial credit)
#   - meets=False, LOW:    Hoàn toàn không có bằng chứng  → 0%
#
# Các giá trị này có thể điều chỉnh theo thực nghiệm mà không cần sửa logic.
# ─────────────────────────────────────────────────────────────────────────────
CONFIDENCE_SCORE_MAP: dict[tuple[bool, str], float] = {
    (True, "HIGH"): 1.0,
    (True, "MEDIUM"): 0.8,
    (False, "MEDIUM"): 0.3,
    (False, "HIGH"): 0.0,  # LLM nói không đạt nhưng rất chắc chắn → 0
    (False, "LOW"): 0.0,
}

# Hệ số pedigree bonus theo rank — khớp với RANK_SCORE_MAP trong knowledge_base.py
# Dùng để scale bonus_points khi có nhiều tier (thay vì cộng flat như cũ)
PEDIGREE_RANK_MULTIPLIER: dict[str, float] = {
    "INTERNATIONAL": 1.0,
    "TIER_1": 0.8,
    "TIER_2": 0.5,
    "TIER_3": 0.2,
    "UNKNOWN": 0.0,
}


class DeterministicScoringEngine:
    def calculate_score(
        self,
        job_config: JobConfiguration,
        evidence_matrix: list[CompetencyEvidence],
        cv_data: dict,  # CVExtractionResponse as dict
    ) -> dict:
        """
        Tính điểm số xác định (deterministic) dựa trên Năng lực và Institutional Rules.

        Returns:
            dict gồm:
              - overall_score, hard_skill_score, soft_skill_score, experience_score, bonus_score
              - is_rejected, rejection_reason
              - breakdown: ScoringBreakdown (audit trail chi tiết)
        """
        raw_scores = {
            "overall_score": 0.0,
            "hard_skill_score": 0.0,
            "soft_skill_score": 0.0,
            "experience_score": 0.0,
            "bonus_score": 0.0,
            "is_rejected": False,
            "rejection_reason": None,
            "breakdown": None,
        }

        if not job_config or not job_config.required_competencies:
            return raw_scores

        # ── Tích lũy điểm ──────────────────────────────────────────────────
        total_weight = 0.0
        earned_weight = 0.0

        hard_total, hard_earned = 0.0, 0.0
        soft_total, soft_earned = 0.0, 0.0
        exp_total, exp_earned = 0.0, 0.0

        evidence_map = {e.competency_id: e for e in evidence_matrix}
        competency_score_details: list[CompetencyScoreDetail] = []

        # ── 1. Tính điểm từng Competency ───────────────────────────────────
        for comp in job_config.required_competencies:
            total_weight += comp.weight

            evidence = evidence_map.get(comp.competency_id)

            # Xác định hệ số từ bảng CONFIDENCE_SCORE_MAP
            if evidence:
                meets = evidence.meets_requirement
                conf = evidence.confidence.upper()
                multiplier = CONFIDENCE_SCORE_MAP.get((meets, conf), 0.0)
            else:
                # Không có evidence từ LLM
                meets = False
                conf = "LOW"
                multiplier = 0.0

            # Knockout check — PHẢI xảy ra trước khi cộng điểm
            if multiplier == 0.0 and comp.is_mandatory:
                reason = f"Không đáp ứng tiêu chí bắt buộc (Knockout): {comp.name}"
                logger.info(f"Knockout triggered: {comp.name}")
                raw_scores["is_rejected"] = True
                raw_scores["rejection_reason"] = reason
                raw_scores["breakdown"] = ScoringBreakdown(
                    rejection_reason=reason,
                    competency_scores=competency_score_details,
                ).model_dump()
                return raw_scores

            # Cộng điểm theo hệ số
            contrib = comp.weight * multiplier
            earned_weight += contrib

            if comp.category == "HARD_SKILL":
                hard_total += comp.weight
                hard_earned += contrib
            elif comp.category == "SOFT_SKILL":
                soft_total += comp.weight
                soft_earned += contrib
            elif comp.category == "EXPERIENCE":
                exp_total += comp.weight
                exp_earned += contrib
            # PEDIGREE category: tính vào overall nhưng không có sub-score riêng

            # Ghi audit detail
            competency_score_details.append(
                CompetencyScoreDetail(
                    competency_id=comp.competency_id,
                    competency_name=comp.name,
                    category=comp.category,
                    weight=comp.weight,
                    earned_weight=contrib,
                    multiplier=multiplier,
                    meets_requirement=meets,
                    confidence=conf,
                    is_mandatory=comp.is_mandatory,
                )
            )

        # ── Chuẩn hóa điểm về thang 100 ───────────────────────────────────
        if total_weight > 0:
            raw_scores["overall_score"] = (earned_weight / total_weight) * 100.0
        if hard_total > 0:
            raw_scores["hard_skill_score"] = (hard_earned / hard_total) * 100.0
        if soft_total > 0:
            raw_scores["soft_skill_score"] = (soft_earned / soft_total) * 100.0
        if exp_total > 0:
            raw_scores["experience_score"] = (exp_earned / exp_total) * 100.0

        # ── 2. Áp dụng Institutional Rules ────────────────────────────────
        bonus_total = 0.0
        overall_delta = 0.0
        rules_triggered: list[RuleTriggered] = []

        for rule in job_config.institutional_rules:
            rule_code = rule.get("rule_code", "")
            rule_name = rule.get("name", rule_code)
            bonus_points = float(rule.get("bonus_points", 0.0))
            max_impact_pct = float(
                rule.get("max_impact_percent", 20.0)
            )  # % overall tối đa ảnh hưởng

            triggered_by, rank, rank_multiplier = self._evaluate_rule(
                rule_code=rule_code,
                domain=job_config.job_family,
                cv_data=cv_data,
            )

            if triggered_by:
                # Bonus thực tế = bonus_points × hệ số rank × (max_impact / 100)
                actual_impact = (
                    bonus_points * rank_multiplier * (max_impact_pct / 100.0)
                )
                bonus_total += bonus_points * rank_multiplier
                overall_delta += actual_impact

                logger.info(
                    f"Rule '{rule_code}' triggered by '{triggered_by}' (rank={rank}). "
                    f"bonus_points={bonus_points}, rank_multiplier={rank_multiplier:.1f}, "
                    f"actual_impact=+{actual_impact:.2f}"
                )

                rules_triggered.append(
                    RuleTriggered(
                        rule_code=rule_code,
                        rule_name=rule_name,
                        bonus_added=round(bonus_points * rank_multiplier, 2),
                        actual_impact=round(actual_impact, 2),
                        triggered_by=triggered_by,
                    )
                )

        raw_scores["bonus_score"] = min(round(bonus_total, 2), 100.0)

        # Cộng bonus delta vào overall, giới hạn 100
        final_overall = raw_scores["overall_score"] + overall_delta
        raw_scores["overall_score"] = min(round(final_overall, 2), 100.0)

        # ── 3. Gắn ScoringBreakdown ────────────────────────────────────────
        raw_scores["breakdown"] = ScoringBreakdown(
            competency_scores=competency_score_details,
            rules_triggered=rules_triggered,
        ).model_dump()

        return raw_scores

    def _evaluate_rule(
        self,
        rule_code: str,
        domain: str,
        cv_data: dict,
    ) -> tuple[Optional[str], str, float]:
        """
        Đánh giá một rule và trả về (triggered_by_name, rank, rank_multiplier).
        Nếu rule không trigger, trả về (None, "UNKNOWN", 0.0).
        """
        rule_code_upper = rule_code.upper()

        if "SCHOOL" in rule_code_upper or "UNIVERSITY" in rule_code_upper:
            # Kiểm tra tất cả trường trong education của CV
            for edu in cv_data.get("education", []):
                institution = edu.get("institution", "")
                rank, _ = knowledge_base.check_university_tier(institution)
                rank_multiplier = PEDIGREE_RANK_MULTIPLIER.get(rank, 0.0)

                # Chỉ trigger nếu rank phù hợp với rule
                if self._rank_matches_rule(rule_code_upper, rank):
                    return (institution, rank, rank_multiplier)

        elif "COMPANY" in rule_code_upper:
            # Kiểm tra tất cả công ty trong experience của CV
            for exp in cv_data.get("experience", []):
                company = exp.get("company", "")
                rank, _ = knowledge_base.check_company_tier(company, domain)
                rank_multiplier = PEDIGREE_RANK_MULTIPLIER.get(rank, 0.0)

                if self._rank_matches_rule(rule_code_upper, rank):
                    return (company, rank, rank_multiplier)

        return (None, "UNKNOWN", 0.0)

    @staticmethod
    def _rank_matches_rule(rule_code_upper: str, rank: str) -> bool:
        """
        Kiểm tra rank của tổ chức có match với tiêu chí của rule không.

        Ví dụ:
          rule INTERNATIONAL_SCHOOL_BONUS → chỉ match rank INTERNATIONAL
          rule TIER_1_SCHOOL_BONUS        → match INTERNATIONAL hoặc TIER_1
          rule TIER_2_SCHOOL_BONUS        → match INTERNATIONAL, TIER_1, hoặc TIER_2
        """
        if rank == "UNKNOWN":
            return False
        if "INTERNATIONAL" in rule_code_upper:
            return rank == "INTERNATIONAL"
        if "TIER_1" in rule_code_upper:
            return rank in ("INTERNATIONAL", "TIER_1")
        if "TIER_2" in rule_code_upper:
            return rank in ("INTERNATIONAL", "TIER_1", "TIER_2")
        # Rule chung (không chỉ định tier): trigger với bất kỳ rank nào
        return rank != "UNKNOWN"


scoring_engine = DeterministicScoringEngine()
