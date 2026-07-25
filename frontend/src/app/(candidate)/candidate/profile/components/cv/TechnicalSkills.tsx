import { Icon } from "./Icon";
import type { CategorizedSkills } from "@/types/cv-analysis";

interface SkillRowProps {
  label: string;
  items: string[];
  bg: string;
  fg: string;
  border: string;
}

function SkillRow({ label, items, bg, fg, border }: SkillRowProps) {
  if (items.length === 0) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 text-xs text-[#44474F] pt-1 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((s) => (
          <span
            key={s}
            className="px-2 py-1 rounded text-xs border capitalize"
            style={{ backgroundColor: bg, color: fg, borderColor: border }}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface TechnicalSkillsProps {
  skills: CategorizedSkills;
}

export function TechnicalSkills({ skills }: TechnicalSkillsProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="code" className="text-[#4F46E5]" />
        Technical Skills
      </h3>
      <div className="flex flex-col gap-3">
        <SkillRow
          label="Hard Skills"
          items={skills.industry_knowledge_and_hard_skills}
          bg="#F5F3FF"
          fg="#5B21B6"
          border="#EDE9FE"
        />
        <SkillRow
          label="Tools"
          items={skills.tools_and_software}
          bg="#ECFEFF"
          fg="#155E75"
          border="#CFFAFE"
        />
        <SkillRow
          label="Soft Skills"
          items={skills.soft_skills}
          bg="#FFFBEB"
          fg="#92400E"
          border="#FEF3C7"
        />
      </div>
    </div>
  );
}
