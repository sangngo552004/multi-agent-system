export interface ConfidenceScoreProps {
  /** 0..1 or 0..100 */
  score: number;
  label?: string;
}

export function ConfidenceScore({ score, label = "AI Confidence Score" }: ConfidenceScoreProps) {
  const pct = Math.round((score <= 1 ? score * 100 : score));
  return (
    <div className="glass-card p-6 ai-gradient-border">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-sm text-[#4F46E5] font-bold">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#EEF0F5] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#9333EA]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
