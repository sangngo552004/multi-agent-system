from schemas import JobRequirement, WorkflowState
from workflow import SupervisorWorkflow


def print_section(title: str) -> None:
    print(f"\n=== {title} ===")


def main() -> None:
    raw_cv_text = """
    Nguyen Van A
    Backend Developer with 3 years experience.
    Skills: Python, FastAPI, Docker, Git, React.
    Worked with cross-functional teams and has IELTS 7.0.
    """

    job = JobRequirement(
        title="Backend Engineer",
        required_skills=["python", "fastapi", "postgresql", "aws"],
        preferred_skills=["docker", "git"],
        min_years_experience=2,
    )

    state = WorkflowState(raw_cv_text=raw_cv_text, job=job)
    final_state = SupervisorWorkflow().run(state)

    print_section("Job")
    print(job)

    print_section("Candidate Profile")
    print(final_state.candidate)

    print_section("Match Result")
    print(final_state.match_result)

    print_section("Human Approval")
    print(final_state.approved_by_human)

    print_section("Learning Path")
    if final_state.learning_path:
        for step in final_state.learning_path:
            print(f"- {step}")
    else:
        print("Khong sinh learning path vi ung vien bi dung o buoc review/reject.")


if __name__ == "__main__":
    main()
