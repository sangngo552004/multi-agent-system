"""Service for matching vectors (local equivalent of pgvector for 1-1 matching)."""

from scipy.spatial.distance import cosine

from app.agents.matcher_agent.embedding_service import embedding_service
from app.core.schemas import MatchedCriterion, MissingCriterion

# Threshold for a "match"
SIMILARITY_THRESHOLD = 0.65


class VectorMatcher:
    def calculate_similarity(self, vec1: list[float], vec2: list[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        if not vec1 or not vec2:
            return 0.0
        # Cosine distance returns 0 for identical, 1 for orthogonal, 2 for opposite.
        # Cosine similarity = 1 - cosine_distance
        distance = cosine(vec1, vec2)
        return 1.0 - distance

    def match_skills(
        self, cv_skills: list[str], job_skills: list[str]
    ) -> tuple[list[MatchedCriterion], list[MissingCriterion], float]:
        """
        Match CV skills against Job skills using embeddings.
        Returns (matched_criteria, missing_criteria, hard_skill_score).
        """
        if not job_skills:
            return [], [], 100.0  # No required skills means 100% match

        if not cv_skills:
            # All are missing
            missing = [
                MissingCriterion(
                    skill=sk, criticality="HIGH", reason="Không tìm thấy trong CV"
                )
                for sk in job_skills
            ]
            return [], missing, 0.0

        # Embed all skills
        cv_embeddings = embedding_service.get_embeddings(cv_skills)
        job_embeddings = embedding_service.get_embeddings(job_skills)

        matched = []
        missing = []
        total_score = 0.0

        for i, j_skill in enumerate(job_skills):
            j_emb = job_embeddings[i]

            # Find best matching CV skill
            best_score = 0.0
            best_cv_skill = ""

            for j, c_skill in enumerate(cv_skills):
                c_emb = cv_embeddings[j]
                score = self.calculate_similarity(j_emb, c_emb)
                if score > best_score:
                    best_score = score
                    best_cv_skill = c_skill

            if best_score >= SIMILARITY_THRESHOLD:
                matched.append(
                    MatchedCriterion(
                        skill=j_skill,
                        evidence=f"Khớp với kỹ năng '{best_cv_skill}' trong CV",
                        match_score=best_score,
                    )
                )
                total_score += best_score
            else:
                missing.append(
                    MissingCriterion(
                        skill=j_skill,
                        criticality="HIGH" if best_score < 0.3 else "MEDIUM",
                        reason=f"Kỹ năng gần nhất trong CV là '{best_cv_skill}' (độ tương đồng chỉ {best_score:.2f})"
                        if best_cv_skill
                        else "Chưa có kỹ năng liên quan",
                    )
                )

        # Calculate hard skill score (average match score for required skills)
        # Weight can be adjusted based on criticality
        hard_skill_score = (
            (len(matched) / len(job_skills)) * 100.0 if job_skills else 0.0
        )

        return matched, missing, hard_skill_score


vector_matcher = VectorMatcher()
