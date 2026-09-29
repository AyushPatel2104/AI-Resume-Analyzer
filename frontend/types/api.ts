export type ContactInfo = {
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  location?: string | null;
};

export type ExperienceItem = {
  title?: string | null;
  company?: string | null;
  duration?: string | null;
  description?: string | null;
};

export type EducationItem = {
  degree?: string | null;
  institution?: string | null;
  year?: string | null;
};

export type ParsedProfile = {
  name?: string | null;
  contact: ContactInfo;
  summary?: string | null;
  skills: string[];
  technologies: string[];
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: string[];
  certifications: string[];
  raw_text_preview: string;
};

export type MatchResult = {
  overall_score: number;
  semantic_similarity: number;
  skill_coverage: number;
  matched_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  relevant_experience: string[];
  recommendations: string[];
  jd_skills_detected: string[];
};

export type AnalyzeResponse = {
  analysis_id: string;
  filename: string;
  profile: ParsedProfile;
  match: MatchResult;
  created_at: string;
};

export type AnalysisSummary = {
  id: string;
  original_filename: string;
  overall_score: number;
  created_at: string;
};

export type AnalysisDetail = AnalyzeResponse & {
  job_description: string;
};

export type ApiError = {
  detail: string;
};
