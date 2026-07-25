import type { CvAnalysis } from "@/types/domain/cv-analysis";
import { HeroHeader } from "./HeroHeader";
import { CandidateCard } from "./CandidateCard";
import { ConfidenceScore } from "./ConfidenceScore";
import { ProfessionalSummary } from "./ProfessionalSummary";
import { TechnicalSkills } from "./TechnicalSkills";
import { ExperienceTimeline } from "./ExperienceTimeline";
import { ResumeScore } from "./ResumeScore";
import { AiInsights } from "./AiInsights";
import { KeywordMatch } from "./KeywordMatch";

export interface CvAnalysisViewProps {
  data: CvAnalysis;
  resumeScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  matchedKeywords?: string[];
  avatarUrl?: string;
  onReset?: () => void;
}


export function CvAnalysisView({
  data,
  resumeScore = 82,
  strengths,
  weaknesses,
  matchedKeywords,
  avatarUrl,
  onReset,
}: CvAnalysisViewProps) {
  const defaultStrengths = strengths ?? [
    `Strong ${data.professional_metadata.industries[0] ?? "industry"} foundation.`,
    `${data.professional_metadata.total_years_of_experience}+ years of relevant experience.`,
  ];
  const defaultWeaknesses = weaknesses ?? (
    (data.professional_metadata?.seniority_level || "").toLowerCase().includes("fresher")
      ? ["Lack of commercial experience."]
      : ["Consider adding measurable outcomes to more roles."]
  );

  return (
    <div
      className="min-h-screen bg-[#F7F9FC] text-[#1B1B1F]"
      style={{ fontFamily: "'Google Sans Text', system-ui, sans-serif" }}
    >
      <main className="pt-24 pb-16 px-6 md:px-10 max-w-[1400px] mx-auto">
        <HeroHeader
          processingTimeMs={data.processing_log.processing_time_ms}
          language={data.language_detected}
          extractionMethod={data.processing_log.extraction_method}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 flex flex-col gap-6">
            <CandidateCard
              personal={data.personal_info}
              metadata={data.professional_metadata}
              social={data.social_links}
              avatarUrl={avatarUrl}
            />
            <ConfidenceScore score={data.confidence_scores.overall} />
          </div>

          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            <ProfessionalSummary summary={data.professional_metadata.candidate_summary} />
            <TechnicalSkills skills={data.categorized_skills} />
            <ExperienceTimeline experience={data.experience} />
          </div>

          <div className="col-span-1 flex flex-col gap-6">
            <ResumeScore score={resumeScore} />
            <AiInsights strengths={defaultStrengths} weaknesses={defaultWeaknesses} />
            <KeywordMatch keywords={data.normalized_keywords} matched={matchedKeywords} />
          </div>
        </div>

        <div className="mt-10 flex justify-end gap-4 flex-wrap">
          {onReset && (
            <button 
              onClick={onReset}
              className="px-4 py-2 border border-[#C4C6D0] text-[#44474F] rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Upload New CV
            </button>
          )}
          <button className="px-4 py-2 border border-[#C4C6D0] text-[#4F46E5] rounded-lg font-medium text-sm hover:bg-white transition-colors">
            Export JSON
          </button>
          <button className="px-4 py-2 bg-[#EDE9FE] text-[#4F46E5] rounded-lg font-medium text-sm hover:opacity-90 transition-opacity">
            Compare With Job Description
          </button>
        </div>
      </main>
    </div>
  );
}
