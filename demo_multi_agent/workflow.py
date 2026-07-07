from agents import CVAnalysisAgent, CareerAdvisorAgent, SkillGapAgent
from schemas import WorkflowState


class SupervisorWorkflow:
    """Dieu phoi thu tu chay giua cac agent."""

    def __init__(self) -> None:
        self.cv_agent = CVAnalysisAgent()
        self.skill_gap_agent = SkillGapAgent()
        self.career_agent = CareerAdvisorAgent()

    def run(self, state: WorkflowState) -> WorkflowState:
        state.candidate = self.cv_agent.run(state.raw_cv_text)
        state.match_result = self.skill_gap_agent.run(state.candidate, state.job)

        # Diem dung HITL mo phong: neu qua kem thi dung tai day.
        if state.match_result.decision == "REJECT":
            state.approved_by_human = False
            return state

        state.approved_by_human = True
        state.learning_path = self.career_agent.run(state.match_result.missing_skills)
        return state
