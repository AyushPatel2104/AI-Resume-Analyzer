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

export type SkillGapItem = {
  item: string;
  severity: "critical" | "important" | "optional" | string;
  detail: string;
};

export type MatchComponents = {
  skill_score: number;
  semantic_score: number | null;
  semantic_available: boolean;
  semantic_method: string;
  text_similarity_score: number | null;
  experience_score: number | null;
  experience_available: boolean;
  education_score: number | null;
  education_available: boolean;
  education_requirement_specified: boolean;
  project_score: number;
  seniority_score: number | null;
  seniority_available: boolean;
  required_coverage: number;
  preferred_coverage: number;
  keyword_score: number;
  weights_applied: Record<string, number>;
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
  matched_required_skills?: string[];
  missing_required_skills?: string[];
  matched_preferred_skills?: string[];
  missing_preferred_skills?: string[];
  partial_matches?: string[];
  relevant_projects?: string[];
  skill_gaps?: SkillGapItem[];
  components?: MatchComponents | null;
  score_disclaimer?: string;
  matcher_version?: string;
};

export type AnalyzeResponse = {
  analysis_id: string;
  resume_id: string;
  job_id: string;
  filename: string;
  profile: ParsedProfile;
  match: MatchResult;
  created_at: string;
};

export type AnalysisSummary = {
  id: string;
  resume_id: string;
  job_id: string;
  resume_name: string;
  original_filename: string;
  job_title: string;
  company_name: string | null;
  overall_score: number;
  created_at: string;
};

export type NormalizedRequirements = {
  required_skills: string[];
  preferred_skills: string[];
  programming_languages: string[];
  frameworks: string[];
  tools: string[];
  databases: string[];
  cloud_platforms: string[];
  education_requirements: string[];
  experience_years: string | null;
  seniority_level: string | null;
  job_type: string | null;
  location: string | null;
  work_mode: string | null;
  jd_skills_detected: string[];
};

export type JobSummary = {
  id: string;
  title: string;
  company_name: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export type JobDetail = {
  id: string;
  title: string;
  company_name: string | null;
  source_url: string | null;
  job_description: string;
  normalized_requirements: NormalizedRequirements | null;
  created_at: string;
  updated_at: string;
};

export type JobImportPreview = {
  title: string;
  company_name: string | null;
  job_description: string;
  source_url: string;
  normalized_requirements: NormalizedRequirements;
};

export type ResumeSummary = {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  profile_name: string | null;
  skills_count: number;
};

export type ResumeDetail = {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  profile: ParsedProfile;
};

export type AnalysisDetail = AnalyzeResponse & {
  job_description: string;
};

export type ApiError = {
  detail: string;
};

export type UserPublic = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
};

export type AuthTokenResponse = {
  access_token: string;
  token_type: string;
  user: UserPublic;
};

export type RegisterRequest = {
  email: string;
  password: string;
  full_name?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type IntelligenceRecommendation = {
  category: string;
  severity: string;
  title: string;
  explanation: string;
  evidence: string;
  suggested_improvement: string;
};

export type IntelligenceComponents = {
  completeness: number;
  structure: number;
  content_quality: number;
  skills_quality: number;
  experience_quality: number | null;
  experience_available: boolean;
  project_quality: number | null;
  projects_available: boolean;
  parsing_readiness: number;
  impact_signals: number;
  weights_applied: Record<string, number>;
};

export type JobMatchSnapshot = {
  job_id: string;
  job_title: string;
  company_name: string | null;
  overall_score: number;
  matcher_version: string;
  disclaimer: string;
};

export type SectionStatus = {
  detected: boolean;
  evidence: string;
  strength: string;
};

export type CareerAssistantItem = {
  category: string;
  severity: string;
  title: string;
  why_it_matters: string;
  evidence: string;
  suggested_action: string;
};

export type CareerReviewResponse = {
  mode: string;
  resume_id: string;
  job_id: string | null;
  resume_health_score: number;
  job_match_score: number | null;
  matcher_version: string | null;
  strengths: CareerAssistantItem[];
  weaknesses: CareerAssistantItem[];
  priority_improvements: CareerAssistantItem[];
  provider: string;
};

export type RewriteResponse = {
  original: string;
  rewritten: string;
  changes: string[];
  evidence_used: string[];
  missing_information: string[];
  safety_notes: string[];
  provider: string;
};

export type ApplicationJobSummary = {
  id: string;
  title: string;
  company_name: string | null;
  source_url: string | null;
  location: string | null;
};

export type ApplicationResumeSummary = {
  id: string;
  name: string;
};

export type ApplicationAnalysisLink = {
  analysis_id: string | null;
  job_match_score: number | null;
  analyzed_at: string | null;
  resume_health_score: number | null;
  scores_note: string;
};

export type ApplicationSummary = {
  id: string;
  status: string;
  applied_at: string | null;
  follow_up_date: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  job: ApplicationJobSummary;
  resume: ApplicationResumeSummary;
  latest_job_match_score: number | null;
  latest_analysis_id: string | null;
};

export type ApplicationDetail = {
  id: string;
  status: string;
  applied_at: string | null;
  follow_up_date: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job: ApplicationJobSummary;
  resume: ApplicationResumeSummary;
  analysis: ApplicationAnalysisLink;
};

export type ApplicationStatistics = {
  total: number;
  saved: number;
  applied: number;
  screening: number;
  interview: number;
  offer: number;
  rejected: number;
  withdrawn: number;
  upcoming_follow_ups: number;
};

export type ApplicationListResponse = {
  items: ApplicationSummary[];
  statistics: ApplicationStatistics;
};

export type CareerAskResponse = {
  intent: string;
  answer: string;
  review: CareerReviewResponse | null;
  rewrite: RewriteResponse | null;
  provider: string;
};

export type ResumeIntelligenceResponse = {
  resume_id: string;
  resume_health_score: number;
  score_disclaimer: string;
  sections: Record<string, SectionStatus>;
  parsing_risks: Array<{ level: string; title: string; detail: string }>;
  content_quality: { score: number; issues: string[] };
  skills_quality: {
    score: number;
    issues: string[];
    missing_in_skills_section?: string[];
  };
  experience_quality: { available: boolean; score: number | null; issues: string[] };
  project_quality: { available: boolean; score: number | null; issues: string[] };
  impact: {
    score: number;
    summary: string;
    measurable_signals?: string[];
    action_verb_count?: number;
  };
  keywords: Record<string, unknown> & {
    mode?: string;
    career_keywords?: string[];
    missing_required_terms?: string[];
    missing_preferred_terms?: string[];
  };
  components: IntelligenceComponents;
  recommendations: IntelligenceRecommendation[];
  job_match: JobMatchSnapshot | null;
};
