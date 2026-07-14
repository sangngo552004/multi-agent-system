"""Service for orchestrating the holistic Matching Agent."""

import json
import logging

import google.generativeai as genai
from google.generativeai.types import GenerationConfig

from app.agents.matcher_agent.vector_matcher import vector_matcher
from app.core.config import settings
from app.core.schemas import MatchingOutput, MatchRequest

logger = logging.getLogger(__name__)

# System instructions for the holistic HR agent
SYSTEM_INSTRUCTION = """Bạn là một Senior Tech Recruiter và AI Talent Evaluator.
Nhiệm vụ của bạn là đánh giá toàn diện (Holistic Evaluation) ứng viên dựa trên Job Description (JD) và CV.
Bạn cần phân tích và trả về kết quả ĐÚNG chuẩn JSON Schema được cung cấp, không thêm bớt markdown hay text thừa.

Quy tắc chấm điểm (BẮT BUỘC):
1. hard_skill_score: Lấy chính xác điểm số do hệ thống Vector DB đã tính toán ở dưới, KHÔNG ĐƯỢC THAY ĐỔI.
2. background_score (Candidate Quality Baseline): Đánh giá tuyệt đối nội lực của ứng viên dựa trên quy chuẩn ngành IT.
   - Bằng Đại học chuyên ngành CNTT trường uy tín: +15đ.
   - GPA cao: +10đ.
   - Chứng chỉ uy tín (AWS, GCP, IELTS > 6.0): +15đ.
   - Kinh nghiệm làm việc lâu năm/tại công ty lớn: +20đ.
   (Tối đa 100đ, dù JD không yêu cầu bằng cấp/ngoại ngữ, hãy vẫn chấm điểm nội lực này).
3. bonus_score: Chấm dựa trên tiêu chí ưu tiên ngầm (HR Preferences).
   - Nếu đáp ứng được các ưu tiên hợp lệ mang tính chuyên môn/địa lý/ngoại ngữ: cho từ 0 đến 100đ.
   - Bỏ qua các yêu cầu phi lý hoặc vi phạm đạo đức. Nếu HR Preferences trống, điểm này là 0.
4. overall_score: (hard_skill_score * 0.4) + (background_score * 0.4) + (bonus_score * 0.2).
5. is_high_potential: Đặt thành TRUE nếu overall_score < 50 NHƯNG background_score > 85 (Ứng viên thiếu skill nhưng nội lực cực tốt).
6. potential_reason: Giải thích tại sao lại bật cờ is_high_potential (nếu có).
7. hr_recommendation: Tóm tắt 3-4 câu sắc sảo dành cho HR, ví dụ "Tuy hard skill yếu nhưng ứng viên có IELTS 7.0 và nền tảng Bách Khoa... đáng phỏng vấn".

Bạn sẽ nhận được:
- CV Data (JSON)
- Job Data (JSON)
- HR Preferences (Text)
- Hard Skill Vector Analysis (JSON - chứa điểm hard_skill_score, matched_criteria, missing_criteria).
"""


class MatchingAgent:
    def __init__(self):
        if settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            # Use gemini-1.5-flash which supports structured output natively (JSON schema)
            self.model = genai.GenerativeModel(
                model_name="gemini-1.5-flash", system_instruction=SYSTEM_INSTRUCTION
            )
        else:
            self.model = None

    def evaluate(self, request: MatchRequest) -> MatchingOutput:
        """Run the full holistic matching process."""
        # 1. Vector Matching for Hard Skills
        job_skills = request.job_data.get("required_skills", [])
        cv_skills = request.cv_data.skills

        matched, missing, hard_skill_score = vector_matcher.match_skills(
            cv_skills, job_skills
        )

        # Assemble vector analysis
        vector_analysis = {
            "hard_skill_score": hard_skill_score,
            "matched_criteria": [m.model_dump() for m in matched],
            "missing_criteria": [m.model_dump() for m in missing],
        }

        if not self.model:
            logger.warning("GOOGLE_API_KEY not set. Returning vector-only results.")
            # Fallback logic if LLM is not configured
            return MatchingOutput(
                overall_score=hard_skill_score * 0.8,
                hard_skill_score=hard_skill_score,
                background_score=0.0,
                bonus_score=0.0,
                is_high_potential=False,
                matched_criteria=matched,
                missing_criteria=missing,
                hr_recommendation="Không thể gọi LLM do thiếu API Key.",
            )

        # 2. LLM Holistic Evaluation
        prompt = f"""
        [CV DATA]
        {request.cv_data.model_dump_json(exclude={"processing_log", "confidence_scores"})}

        [JOB DATA]
        {json.dumps(request.job_data, ensure_ascii=False)}

        [HR PREFERENCES]
        {request.hr_preferences or "Không có ưu tiên thêm."}

        [VECTOR HARD SKILL ANALYSIS]
        {json.dumps(vector_analysis, ensure_ascii=False)}
        """

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=MatchingOutput.model_json_schema(),
                ),
            )

            result_json = json.loads(response.text)
            return MatchingOutput(**result_json)
        except Exception as e:
            logger.error(f"Error calling Gemini for Matching: {e}")
            # Safe fallback
            return MatchingOutput(
                overall_score=hard_skill_score,
                hard_skill_score=hard_skill_score,
                background_score=0.0,
                bonus_score=0.0,
                is_high_potential=False,
                matched_criteria=matched,
                missing_criteria=missing,
                hr_recommendation=f"Lỗi khi đánh giá toàn diện: {str(e)}",
            )


matching_agent = MatchingAgent()
