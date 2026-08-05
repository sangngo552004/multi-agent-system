export interface ResumeScoreProps {
  /** 0..100 */
  score: number;
  label?: string;
}

function ratingLabel(score: number) {
  if (score >= 80) return "Excellent Resume";
  if (score >= 60) return "Good Resume";
  if (score >= 40) return "Average Resume";
  return "Needs Improvement";
}

export function ResumeScore({ score, label }: ResumeScoreProps) {
  const rounded = Math.round(score);
  return (
    <div className="glass-card p-6 flex flex-col items-center text-center">
      <h3 className="text-sm font-semibold mb-4">Resume Score</h3>
      <div className="w-32 h-32 rounded-full border-8 border-[#4F46E5] flex items-center justify-center mb-3">
        <span
          className="text-5xl font-bold text-[#4F46E5]"
          style={{ fontFamily: "'Google Sans Display', sans-serif" }}
        >
          {rounded}
        </span>
      </div>
      <span className="px-3 py-1 bg-[#E5F5ED] text-[#005137] rounded-full text-xs font-bold">
        {label ?? ratingLabel(rounded)}
      </span>
    </div>
  );
}
