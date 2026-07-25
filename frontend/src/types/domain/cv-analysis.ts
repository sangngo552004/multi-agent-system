export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface SocialLinks {
  linkedin: string | null;
  portfolio_or_website: string | null;
  other_links: string[];
}

export interface ProfessionalMetadata {
  primary_role: string;
  seniority_level: string;
  total_years_of_experience: number;
  candidate_summary: string;
  industries: string[];
}

export interface CategorizedSkills {
  industry_knowledge_and_hard_skills: string[];
  tools_and_software: string[];
  soft_skills: string[];
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
  position: string | null;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  location: string | null;
  summary: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
  business_domain: string;
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string | number | null;
}

export interface ConfidenceScores {
  overall: number;
  per_field: Record<string, number>;
}

export interface ProcessingLog {
  extraction_method: string;
  ocr_used: boolean;
  fallback_reason: string;
  processing_time_ms: number;
  text_extraction_method: string;
}

export interface CvAnalysis {
  status: string;
  extraction_method: string;
  language_detected: string;
  personal_info: PersonalInfo;
  social_links: SocialLinks;
  professional_metadata: ProfessionalMetadata;
  categorized_skills: CategorizedSkills;
  spoken_languages: string[];
  normalized_keywords: string[];
  skills: string[];
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: unknown[];
  certifications: unknown[];
  confidence_scores: ConfidenceScores;
  warnings: string[];
  processing_log: ProcessingLog;
}
