import { Icon } from "./Icon";
import type { ExperienceItem } from "@/types/domain/cv-analysis";

function ExperienceEntry({ item, active }: { item: ExperienceItem; active?: boolean }) {
  const bullets = [...item.achievements, ...item.responsibilities];
  return (
    <div className="relative">
      <div
        className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white"
        style={{ backgroundColor: active ? "#4F46E5" : "#C4C6D0" }}
      />
      <h4 className="font-bold text-sm mb-1">
        {item.title} <span className="text-[#44474F] font-normal">@ {item.company}</span>
      </h4>
      <p className="text-xs text-[#44474F] mb-2">Duration: {item.duration}</p>
      {item.technologies.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {item.technologies.map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 bg-[#EEF0F5] text-[#1B1B1F] text-xs rounded capitalize"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <ul className="list-disc list-inside text-sm text-[#44474F] space-y-1">
        {bullets.slice(0, 3).map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

export interface ExperienceTimelineProps {
  experience: ExperienceItem[];
  title?: string;
}

export function ExperienceTimeline({
  experience,
  title = "Key Experience",
}: ExperienceTimelineProps) {
  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Icon name="work" className="text-[#4F46E5]" />
        {title}
      </h3>
      <div className="relative pl-6 border-l-2 border-[#E4E6EC] space-y-6">
        {experience.map((item, i) => (
          <ExperienceEntry key={`${item.company}-${i}`} item={item} active={i === 0} />
        ))}
      </div>
    </div>
  );
}
