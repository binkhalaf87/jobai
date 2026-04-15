// Shared frontend-only TypeScript types can be collected here as the app grows.
export type NavItem = {
  label: string;
  key?: string;
  href: string;
  icon?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: "jobseeker" | "recruiter";
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
  role?: "jobseeker" | "recruiter";
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
export type InterviewerStyle = "supportive" | "direct" | "challenging";

export type InterviewQuestion = {
  index: number;
  question: string;
  type: "hr" | "technical";
  source?: "opening" | "planned" | "follow_up" | null;
  focus_area?: string | null;
};

export type AnswerEvaluation = {
  score: number;
  strengths: string[];
  weaknesses: string[];
  improved_answer: string;
  interviewer_reply: string;
  communication_tip?: string | null;
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

export type InterviewContextSummary = {
  resume_id?: string | null;
  resume_title?: string | null;
  company_name?: string | null;
  interviewer_style?: InterviewerStyle | null;
  has_job_description: boolean;
  focus_areas: string[];
  target_role_summary?: string | null;
};

export type InterviewFinalReport = {
  overall_score: number;
  readiness: "Needs Improvement" | "Good Progress" | "Interview Ready";
  summary: string;
  breakdown: ScoreBreakdown;
  top_strengths: string[];
  priority_improvements: string[];
  recommended_drills: string[];
};

export type InterviewSessionResponse = {
  id: string;
  job_title: string;
  experience_level: ExperienceLevel;
  interview_type: InterviewType;
  language: InterviewLanguage;
  question_count: number;
  questions: InterviewQuestion[];
  opening_message?: string | null;
  context_summary?: InterviewContextSummary | null;
  status: string;
  created_at: string;
};

export type InterviewCompleteResponse = InterviewSessionResponse & {
  answers: InterviewAnswer[];
  overall_score: number;
  final_report: InterviewFinalReport;
};

// ─── Job Search ───────────────────────────────────────────────────────────────

export type JobResult = {
  job_id: string;
  job_title: string;
  company_name: string;
  employer_logo: string | null;
  location: string | null;
  employment_type: string | null;
  job_description: string | null;
  apply_link: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  source: string | null;
  posted_at: string | null;
  fit_score: number | null;
  is_saved: boolean;
};

export type JobSearchResponse = {
  query: string;
  location: string;
  page: number;
  total_found: number;
  results: JobResult[];
};

export type SavedJob = {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  employer_logo: string | null;
  location: string | null;
  employment_type: string | null;
  job_description: string | null;
  apply_link: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  source: string | null;
  fit_score: number | null;
  posted_at: string | null;
  created_at: string;
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

// ─── Smart Send ───────────────────────────────────────────────────────────────

export type SmtpConnection = {
  id: string;
  gmail_address: string;
  display_name: string;
  is_verified: boolean;
  created_at: string;
};

export type LetterVariant = {
  subject: string;
  body: string;
};

export type GeneratedLetters = {
  formal: LetterVariant;
  creative: LetterVariant;
  concise: LetterVariant;
};

export type GenerateLettersResponse = {
  campaign_id: string;
  letters: GeneratedLetters;
};

export type RecipientIn = {
  email: string;
  name?: string;
};

export type SendLogItem = {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  status: "sent" | "failed";
  error_message: string | null;
  sent_at: string | null;
};

export type Campaign = {
  id: string;
  job_title: string;
  company_name: string | null;
  status: "draft" | "sending" | "completed" | "failed";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  selected_variant: string | null;
  subject: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  logs: SendLogItem[];
};


export type BillingRole = "jobseeker" | "recruiter";
export type BillingPlanKind = "subscription" | "points_pack";
export type BillingInterval = "monthly" | "one_time";
export type BillingOrderStatus =
  | "pending"
  | "payment_key_issued"
  | "paid"
  | "failed"
  | "canceled"
  | "expired"
  | "refunded"
  | "partially_refunded";
export type BillingOrderType = "subscription_initial" | "subscription_renewal" | "points_purchase";

export type BillingPlan = {
  id: string;
  code: string;
  name: string;
  audience: BillingRole;
  kind: BillingPlanKind;
  billing_interval: BillingInterval;
  currency: string;
  price_amount_minor: number | null;
  points_grant: number;
  is_active: boolean;
  display_order: number;
  description: string | null;
  metadata_payload: Record<string, unknown> | null;
};

export type BillingPlansResponse = {
  role: BillingRole;
  plans: BillingPlan[];
};

export type BillingCheckoutPayload = {
  plan_code: string;
  billing_data: {
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone_number: string;
    apartment?: string | null;
    floor?: string | null;
    street?: string | null;
    building?: string | null;
    shipping_method?: string | null;
    postal_code?: string | null;
    city?: string | null;
    country?: string | null;
    state?: string | null;
  };
};

export type BillingCheckoutResponse = {
  payment_order_id: string;
  merchant_reference: string;
  provider_name: string;
  status: BillingOrderStatus;
  order_type: BillingOrderType;
  amount_minor: number;
  currency: string;
  plan: {
    code: string;
    name: string;
    kind: BillingPlanKind;
    billing_interval: BillingInterval;
    currency: string;
    price_amount_minor: number | null;
    points_grant: number;
  };
  checkout: {
    intention_id: string;
    client_secret: string;
    public_key: string;
    integration_id: number;
    iframe_id: string | null;
  };
};

export type BillingSubscriptionSummary = {
  id: string;
  plan_id: string | null;
  plan_name: string;
  status: string;
  provider_name: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type BillingWalletSummary = {
  id: string | null;
  balance_points: number;
  lifetime_earned_points: number;
  lifetime_spent_points: number;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type BillingOrderSummary = {
  id: string;
  plan_code: string;
  plan_name: string;
  order_type: BillingOrderType;
  status: BillingOrderStatus;
  amount_minor: number;
  currency: string;
  provider_name: string;
  created_at: string;
  paid_at: string | null;
  failure_reason: string | null;
};

export type BillingMeResponse = {
  user_id: string;
  role: BillingRole;
  current_subscription: BillingSubscriptionSummary | null;
  wallet: BillingWalletSummary | null;
  recent_orders: BillingOrderSummary[];
};

export type BillingWalletTransaction = {
  id: string;
  transaction_type: string;
  status: string;
  direction: "credit" | "debit";
  points: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  effective_at: string;
};

export type BillingWalletTransactionsResponse = {
  user_id: string;
  transactions: BillingWalletTransaction[];
};
