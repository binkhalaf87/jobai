// Shared frontend-only TypeScript types can be collected here as the app grows.
export type NavItem = {
  label: string;
  href: string;
  icon?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  full_name?: string;
};

export type ResumeUploadResponse = {
  resume_id: string;
};

export type ResumeListItem = {
  id: string;
  title: string;
  source_filename: string | null;
  file_type: string | null;
  page_count: number | null;
  processing_status: string;
  created_at: string;
};

export type ResumePreview = {
  id: string;
  title: string;
  source_filename: string | null;
  processing_status: string;
  raw_text_preview: string;
  normalized_text_preview: string;
};

export type AIReportListItem = {
  id: string;
  resume_id: string;
  resume_title: string | null;
  report_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

export type AIReportFull = AIReportListItem & {
  job_description_text: string | null;
  model_name: string | null;
  report_text: string | null;
};

export type JobDescriptionPayload = {
  title: string;
  company_name?: string;
  source_url?: string;
  source_text: string;
  employment_type?: string;
  location_text?: string;
};

export type JobDescriptionSubmitResponse = {
  job_description_id: string;
  title: string;
  normalized_text_preview: string;
};

export type AnalysisRequestPayload = {
  resume_id: string;
  job_description_id: string;
};

export type AnalysisScoreBreakdownItem = {
  score: number;
  weight: number;
  weighted_score: number;
};

export type AnalysisScoreBreakdown = {
  match: AnalysisScoreBreakdownItem;
  ats: AnalysisScoreBreakdownItem;
  content: AnalysisScoreBreakdownItem;
  completeness: AnalysisScoreBreakdownItem;
};

export type AnalysisMatchResult = {
  match_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
  cosine_similarity_score: number;
};

export type AnalysisIssue = {
  category: string;
  severity: string;
  message: string;
};

export type SuggestionSection = "summary" | "experience" | "skills" | "education" | "general";

export type AnalysisAtsResult = {
  ats_score: number;
  issues: AnalysisIssue[];
  suggestions: string[];
};

export type AnalysisScoreResult = {
  overall_score: number;
  detailed_score_breakdown: AnalysisScoreBreakdown;
  explanation: string;
};

export type AnalysisFullResult = {
  job_description_keywords: {
    hard_skills?: string[];
    soft_skills?: string[];
    job_titles?: string[];
    tools?: string[];
    years_of_experience?: string[];
    role_keywords?: string[];
  };
  match: AnalysisMatchResult;
  ats: AnalysisAtsResult;
  score: AnalysisScoreResult;
};

export type AnalysisFullResponse = {
  analysis_id: string;
  resume_id: string;
  job_description_id: string;
  result: AnalysisFullResult;
};

export type RewriteSuggestion = {
  id: string;
  analysis_id: string;
  section: SuggestionSection;
  original_text: string | null;
  suggested_text: string;
  rationale: string | null;
  is_applied: boolean;
  display_order: number;
  anchor_label: string | null;
  created_at: string;
  updated_at: string;
};

export type RewriteSuggestionRequestPayload = {
  analysis_id: string;
  section: SuggestionSection;
  source_text: string;
  missing_keywords: string[];
  anchor_label?: string;
};

export type RewriteSuggestionResponse = {
  analysis_id: string;
  section: SuggestionSection;
  suggestions: RewriteSuggestion[];
};

// ─── Interview ────────────────────────────────────────────────────────────────

export type ExperienceLevel = "entry" | "mid" | "senior";
export type InterviewType = "hr" | "technical" | "mixed";
export type InterviewLanguage = "en" | "ar";
export type QuestionCount = 3 | 5 | 10;

export type InterviewQuestion = {
  index: number;
  question: string;
  type: "hr" | "technical";
};

export type AnswerEvaluation = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improved_answer: string;
};

export type InterviewAnswer = {
  index: number;
  question: string;
  answer: string;
  evaluation: AnswerEvaluation;
};

export type ScoreBreakdown = {
  relevance: number;
  clarity: number;
  professionalism: number;
  confidence: number;
  role_fit: number;
};

export type InterviewFinalReport = {
  overall_score: number;
  readiness: "Needs Improvement" | "Good Progress" | "Interview Ready";
  summary: string;
  breakdown: ScoreBreakdown;
};

export type InterviewSessionResponse = {
  id: string;
  job_title: string;
  experience_level: ExperienceLevel;
  interview_type: InterviewType;
  language: InterviewLanguage;
  question_count: number;
  questions: InterviewQuestion[];
  status: string;
  created_at: string;
};

export type InterviewCompleteResponse = InterviewSessionResponse & {
  answers: InterviewAnswer[];
  overall_score: number;
  final_report: InterviewFinalReport;
};

export type InterviewListItem = {
  id: string;
  job_title: string;
  experience_level: ExperienceLevel;
  interview_type: InterviewType;
  language: InterviewLanguage;
  question_count: number;
  overall_score: number | null;
  status: string;
  created_at: string;
};
