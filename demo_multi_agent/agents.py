from schemas import CandidateProfile, JobRequirement, MatchResult


class CVAnalysisAgent:
    """Gia lap agent doc CV va chuyen van ban thanh profile co cau truc."""

    KNOWN_SKILLS = {
        "python",
        "fastapi",
        "postgresql",
        "docker",
        "aws",
        "react",
        "nodejs",
        "mongodb",
        "git",
    }

    def run(self, raw_cv_text: str) -> CandidateProfile:
        text = raw_cv_text.lower()
        skills = sorted(skill for skill in self.KNOWN_SKILLS if skill in text)
        years = self._extract_years_experience(text)
        name = self._extract_name(raw_cv_text)

        highlights = []
        if "team lead" in text:
            highlights.append("Co kinh nghiem team lead")
        if "ielts" in text:
            highlights.append("Co kha nang tieng Anh")

        return CandidateProfile(
            name=name,
            years_experience=years,
            skills=skills,
            education="Unknown",
            highlights=highlights,
        )

    def _extract_name(self, raw_cv_text: str) -> str:
        first_line = raw_cv_text.strip().splitlines()[0].strip()
        return first_line or "Unknown Candidate"

    def _extract_years_experience(self, text: str) -> int:
        for token in text.split():
            if token.isdigit():
                return int(token)
        return 0


class SkillGapAgent:
    """Gia lap so khop CV va JD bang rule-based scoring."""

    def run(self, candidate: CandidateProfile, job: JobRequirement) -> MatchResult:
        candidate_skills = set(candidate.skills)
        required = set(job.required_skills)
        preferred = set(job.preferred_skills)

        matched_required = sorted(required & candidate_skills)
        missing_required = sorted(required - candidate_skills)
        matched_preferred = sorted(preferred & candidate_skills)

        score = 0.0
        reasons = []

        if required:
            score += 70 * (len(matched_required) / len(required))
        if preferred:
            score += 20 * (len(matched_preferred) / len(preferred))
        if candidate.years_experience >= job.min_years_experience:
            score += 10
            reasons.append("Dat muc kinh nghiem toi thieu")
        else:
            reasons.append("Chua dat muc kinh nghiem toi thieu")

        reasons.append(f"Match required skills: {len(matched_required)}/{len(required)}")
        reasons.append(f"Match preferred skills: {len(matched_preferred)}/{len(preferred)}")

        if score >= 80 and not missing_required:
            decision = "PASS"
        elif score >= 50:
            decision = "REVIEW"
        else:
            decision = "REJECT"

        return MatchResult(
            matched_skills=sorted(set(matched_required + matched_preferred)),
            missing_skills=missing_required,
            score=round(score, 2),
            decision=decision,
            reasons=reasons,
        )


class CareerAdvisorAgent:
    """Gia lap sinh lo trinh hoc dua tren ky nang con thieu."""

    ROADMAPS = {
        "aws": [
            "Tuan 1: hoc co ban ve cloud va AWS global infrastructure",
            "Tuan 2: hoc EC2, S3, IAM",
            "Tuan 3: deploy mot web app don gian len AWS",
        ],
        "docker": [
            "Tuan 1: hoc image, container, Dockerfile",
            "Tuan 2: dockerize mot ung dung backend",
            "Tuan 3: hoc docker compose cho local development",
        ],
        "postgresql": [
            "Tuan 1: on SQL va thiet ke bang",
            "Tuan 2: hoc index, join, migration",
            "Tuan 3: ket noi backend voi PostgreSQL",
        ],
    }

    def run(self, missing_skills: list[str]) -> list[str]:
        learning_path = []
        for skill in missing_skills:
            steps = self.ROADMAPS.get(
                skill,
                [f"Tao lo trinh tu hoc co ban cho ky nang {skill}"],
            )
            learning_path.append(f"Ky nang can bo sung: {skill}")
            learning_path.extend(steps)
        return learning_path
