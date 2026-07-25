export interface KeywordMatchProps {
  keywords: string[];
  /** Keywords that should be shown as matched (highlighted). If omitted, all are matched. */
  matched?: string[];
  max?: number;
}

export function KeywordMatch({ keywords, matched, max = 12 }: KeywordMatchProps) {
  const matchedSet = matched ? new Set(matched.map((k) => k.toLowerCase())) : null;
  const shown = keywords.slice(0, max);
  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold mb-3">Keyword Match</h3>
      <div className="flex flex-wrap gap-2">
        {shown.map((k) => {
          const isMatched = matchedSet ? matchedSet.has(k.toLowerCase()) : true;
          return (
            <span
              key={k}
              className={`text-xs px-2 py-1 bg-white border border-[#E4E6EC] rounded capitalize ${
                isMatched ? "" : "opacity-50"
              }`}
            >
              {k}
            </span>
          );
        })}
      </div>
    </div>
  );
}
