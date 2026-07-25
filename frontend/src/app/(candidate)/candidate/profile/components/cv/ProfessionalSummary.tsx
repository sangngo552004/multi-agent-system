import { Icon } from "./Icon";

export function ProfessionalSummary({ summary }: { summary: string }) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="person_book" className="text-[#4F46E5]" />
        Professional Summary
      </h3>
      <p className="text-sm text-[#44474F] leading-relaxed">{summary}</p>
    </div>
  );
}
