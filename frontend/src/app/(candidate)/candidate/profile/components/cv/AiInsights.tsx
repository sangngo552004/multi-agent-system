import { Icon } from "./Icon";

function InsightItem({ icon, color, text }: { icon: string; color: string; text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-[#1B1B1F]">
      <Icon name={icon} className="!text-[16px] mt-0.5" />
      <style>{`.material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }`}</style>
      <span style={{ color }} className="hidden" />
      <span>{text}</span>
    </li>
  );
}

export interface AiInsightsProps {
  strengths: string[];
  weaknesses: string[];
}

export function AiInsights({ strengths, weaknesses }: AiInsightsProps) {
  return (
    <div className="glass-card p-6 ai-gradient-border">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <Icon name="psychology" className="text-[#4F46E5] !text-[18px]" />
        AI Insights
      </h3>
      {strengths.length > 0 && (
        <div className="mb-4">
          <span className="text-xs text-[#44474F] block mb-2 uppercase tracking-wide">
            Strengths
          </span>
          <ul className="space-y-2">
            {strengths.map((s, i) => (
              <InsightItem key={i} icon="check_circle" color="#059669" text={s} />
            ))}
          </ul>
        </div>
      )}
      {weaknesses.length > 0 && (
        <div>
          <span className="text-xs text-[#44474F] block mb-2 uppercase tracking-wide">
            Weaknesses
          </span>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <InsightItem key={i} icon="warning" color="#EA580C" text={w} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
