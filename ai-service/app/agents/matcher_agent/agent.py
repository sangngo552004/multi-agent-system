"""Service for orchestrating the holistic Matching Agent using Competency-Based Architecture."""

import json
import logging

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.agents.matcher_agent.kb_loader import get_competency_level_description
from app.agents.matcher_agent.scoring_engine import scoring_engine
from app.agents.matcher_agent.vector_matcher import vector_matcher
from app.core.config import settings
from app.core.schemas import MatchingOutput, MatchRequest, ScoringBreakdown

logger = logging.getLogger(__name__)

# System instructions for Semantic Mapping (Layer 2)
# Khong con logic cham diem (Scoring) o day nua.
SYSTEM_INSTRUCTION = """Bạn là một AI Semantic Mapper chuyên nghiệp trong lĩnh vực tuyển dụng.
Nhiệm vụ duy nhất của bạn là ĐỐI CHIẾU hồ sơ ứng viên (CV) với Danh sách Năng lực yêu cầu (Required Competencies) của công việc.

Quy tắc BẮT BUỘC:
1. KHÔNG tự ý chấm điểm (Scoring). Điểm số sẽ do hệ thống toán học tính toán sau.
2. Với mỗi Năng lực (Competency) được yêu cầu, hãy tìm BẰNG CHỨNG (Evidence) trong CV.
3. Nếu tìm thấy, ghi trích dẫn rõ ràng hoặc tóm tắt nội dung làm bằng chứng, set `meets_requirement` = true, và `confidence` = HIGH/MEDIUM.
4. Nếu không tìm thấy, ghi "Không có thông tin trong CV", set `meets_requirement` = false, và `confidence` = LOW.
5. `hr_recommendation`: Viết 2-3 câu tóm tắt nhận xét chuyên môn về ứng viên này dựa trên bằng chứng tìm được.
6. `is_overqualified` và `is_high_potential`: Bật cờ (true/false) dựa trên nhận định khách quan về số năm kinh nghiệm và chất lượng bằng chứng.
7. Bạn BẮT BUỘC phải trả về đúng chuẩn JSON Schema được cung cấp. Các trường điểm số (overall_score, hard_skill_score...) cứ để mặc định là 0.0.

Bạn sẽ nhận được:
- CV Data (JSON)
- Danh sách Năng lực Yêu cầu (JSON)
- Kết quả đối sánh Vector (Hard skills)
"""


class MatchingAgent:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash", system_instruction=SYSTEM_INSTRUCTION
            )
        else:
            self.model = None

    def evaluate(self, request: MatchRequest) -> MatchingOutput:
        """Run the competency-based matching process."""
        # 1. Fallback & Parse Job Config
        job_config = request.job_configuration
        if not job_config:
            # Fallback for old requests without strict job_configuration
            job_skills = request.job_data.get("required_skills", [])
            # In a real system we would map old job_data to a JobConfiguration object here.
        else:
            job_skills = [
                comp.name
                for comp in job_config.required_competencies
                if comp.category == "HARD_SKILL"
            ]

        # 2. Vector Matching (Layer 1 - Hard Skills)
        cv_skills = request.cv_data.skills
        matched, missing, hard_skill_score = vector_matcher.match_skills(
            cv_skills, job_skills
        )

        if not self.model:
            logger.warning("GOOGLE_API_KEY not set. Returning vector-only results.")
            return MatchingOutput(
                status="ERROR",
                rejection_reason="Missing API Key",
                overall_score=hard_skill_score,
                matched_criteria=matched,
                missing_criteria=missing,
            )

        # 2.5 Early Knockout (Pre-filter to save API cost)
        # Tình huống 1: Thiếu kỹ năng cứng BẮT BUỘC (Mandatory)
        if job_config:
            mandatory_hard_skills = [
                comp.name
                for comp in job_config.required_competencies
                if comp.category == "HARD_SKILL"
                and getattr(comp, "is_mandatory", False)
            ]
            missing_skill_names = [m.skill for m in missing]
            failed_mandatory_skills = set(mandatory_hard_skills).intersection(
                missing_skill_names
            )

            if failed_mandatory_skills:
                logger.info(
                    f"Early Knockout triggered. Missing mandatory skills: {failed_mandatory_skills}"
                )
                return MatchingOutput(
                    status="REJECTED",
                    rejection_reason=f"Bị loại từ vòng Gửi xe (Early Knockout): Thiếu kỹ năng bắt buộc - {', '.join(failed_mandatory_skills)}.",
                    overall_score=hard_skill_score,
                    hard_skill_score=hard_skill_score,
                    matched_criteria=matched,
                    missing_criteria=missing,
                )

        # Tình huống 2: Điểm khớp kỹ năng cứng tổng thể quá thấp (< 30%)
        if job_skills and hard_skill_score < 30.0:
            logger.info(
                f"Early Knockout triggered. Hard skill score: {hard_skill_score}"
            )
            return MatchingOutput(
                status="REJECTED",
                rejection_reason=f"Bị loại từ vòng Gửi xe (Early Knockout): Kỹ năng chuyên môn không khớp ({hard_skill_score:.1f}%).",
                overall_score=hard_skill_score,
                hard_skill_score=hard_skill_score,
                matched_criteria=matched,
                missing_criteria=missing,
            )

        # 3. LLM Semantic Mapping (Layer 2)
        prompt = self._build_prompt(
            request=request,
            job_config=job_config,
            matched=matched,
            missing=missing,
        )

        try:
            # Call LLM to extract evidence
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=MatchingOutput.model_json_schema(),
                ),
            )

            result_json = json.loads(response.text)
            output = MatchingOutput(**result_json)

            # Khôi phục lại matched_criteria từ vector db để không bị mất
            output.matched_criteria = matched
            output.missing_criteria = missing

            # 4. Deterministic Scoring (Layer 4)
            if job_config:
                scores = scoring_engine.calculate_score(
                    job_config=job_config,
                    evidence_matrix=output.evidence_matrix,
                    cv_data=request.cv_data.model_dump(),
                )

                if scores.get("is_rejected"):
                    output.status = "REJECTED"
                    output.rejection_reason = scores.get("rejection_reason")
                else:
                    output.status = "EVALUATED"

                # Override LLM's fake scores with real deterministic scores
                output.overall_score = scores.get("overall_score", 0.0)
                output.hard_skill_score = scores.get("hard_skill_score", 0.0)
                output.soft_skill_score = scores.get("soft_skill_score", 0.0)
                output.experience_score = scores.get("experience_score", 0.0)
                output.bonus_score = scores.get("bonus_score", 0.0)

                # Attach audit trail breakdown
                breakdown_data = scores.get("breakdown")
                if breakdown_data:
                    output.scoring_breakdown = ScoringBreakdown(**breakdown_data)
            else:
                output.overall_score = hard_skill_score
                output.status = "EVALUATED"

            return output

        except Exception as e:
            logger.error(f"Error in Matching Agent: {e}")
            return MatchingOutput(
                status="ERROR",
                rejection_reason=f"LLM Error: {str(e)}",
                overall_score=hard_skill_score,
                matched_criteria=matched,
                missing_criteria=missing,
            )

    def _build_prompt(
        self,
        request: MatchRequest,
        job_config,
        matched: list,
        missing: list,
    ) -> str:
        """
        Xây dựng prompt cho LLM, có nhúc semantic description của required_level.

        Thay vì LLM chỉ thấy số 'required_level: 3', giờ LLM nhận được:
        'required_level: 3 (Ý nghĩa: Thành thạo — Có thể xây dựng REST API độc lập)'
        """
        competencies_with_levels = []
        if job_config:
            for comp in job_config.required_competencies:
                comp_dict = comp.model_dump()
                level = comp_dict.get("required_level", 1)
                level_desc = get_competency_level_description(comp.competency_id, level)
                if level_desc:
                    comp_dict["required_level_description"] = level_desc
                competencies_with_levels.append(comp_dict)

        return f"""
        [CV DATA]
        {request.cv_data.model_dump_json(exclude={{"processing_log", "confidence_scores"}})}

        [REQUIRED COMPETENCIES with Level Descriptions]
        {json.dumps(competencies_with_levels, ensure_ascii=False) if competencies_with_levels else (job_config.model_dump_json() if job_config else json.dumps(request.job_data))}

        [VECTOR MATCHING RESULTS (Use as evidence for hard skills)]
        Matched: {json.dumps([m.model_dump() for m in matched], ensure_ascii=False)}
        Missing: {json.dumps([m.model_dump() for m in missing], ensure_ascii=False)}

        [IMPORTANT] Khi đánh giá mức độ (EXPERIENCE và HARD_SKILL), hãy dựa vào
        required_level_description (đế xác định ứng viên có đáp ứng đú́ng bậc đó hay không,
        không chỉ là có kỹ năng hay không).
        """


matching_agent = MatchingAgent()
