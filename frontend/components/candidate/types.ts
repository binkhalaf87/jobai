export type Stage = "new" | "shortlisted" | "interview" | "rejected";
export type Tab = "screening" | "matches" | "preview" | "notes" | "interview";

export type JobMatch = {
  job_id: string;
  job_title: string;
  overall_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
  raw_payload?: Record<string, unknown>;
};

export type TopRecommendation = {
  job_title: string;
  reason: string;
};

export type CandidateDetail = {
  id: string;
  title: string;
  parsed_name: string | null;
  email: string | null;
  created_at: string;
  stage: Stage;
  status: string;
  skills: string[];
  experience_summary: string[];
  file_type: string | null;
  file_available: boolean;
  source_filename: string | null;
  raw_text: string | null;
  matches: JobMatch[];
  top_recommendation: TopRecommendation | null;
  analysis_completed_at: string | null;
};

export type ScreeningScores = {
  relevant_experience: number;
  core_skills_match: number;
  stability: number;
  growth_and_progression: number;
  role_fit: number;
  final_score: number;
};

export type ScreeningRecommendation = {
  decision: string;
  action: string;
  reason: string;
};

export type ScreeningData = {
  executive_summary: string;
  scores: ScreeningScores;
  decision: string;
  why_hire: string[];
  risks: string[];
  recommendation: ScreeningRecommendation;
  quick_flags: string[];
};

export type ScreeningReport = {
  id: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
  report: ScreeningData | null;
};

export type NextStep = {
  messageKey: string;
  action: string;
  variant: "primary" | "warning" | "neutral";
};

export type CandidateInterview = {
  id: string;
  resume_id: string;
  job_id: string;
  candidate_name: string;
  job_title: string;
  interview_type: string;
  question_count: number;
  status: string;
  response_status: string;
  invite_sent_at: string | null;
  created_at: string;
};

export type InterviewQuestion = {
  index: number;
  question: string;
  type: string;
  focus_area: string | null;
};

export type InterviewDetail = CandidateInterview & {
  questions: InterviewQuestion[];
  candidate_summary: string;
  focus_areas: string[];
};

export type ResponseItem = {
  question_index: number;
  question_text: string;
  text_answer: string | null;
  has_video: boolean;
};

export type QuestionFeedback = {
  index: number;
  score: number;
  feedback: string;
  strength: string;
  weakness: string;
};

export type InterviewResponses = {
  interview_id: string;
  overall_score: number | null;
  overall_impression: string | null;
  hire_recommendation: string | null;
  per_question: QuestionFeedback[];
  responses: ResponseItem[];
};
