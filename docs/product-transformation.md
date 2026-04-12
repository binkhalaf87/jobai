# Product Transformation Plan

## Purpose

Transform the existing platform into a clearer product without removing working functionality and without inventing fake capabilities.

This plan is grounded in the current repository state:

- Job seeker features already exist across `resume upload`, `analysis`, `enhancement`, `job search`, `smart send`, and `AI interview`
- Recruiter features already exist across `candidate upload`, `candidate analysis`, `job posting`, `ranking`, and `pipeline stages`
- The main gap is not missing foundations. The main gap is product cohesion, shared contracts, and reusable workflow states

## Product Constraints

- Do not remove current backend services or routes
- Do not replace the current analysis stack with a new one
- Do not rebuild the frontend from scratch
- Reframe current features into end-to-end journeys
- Reuse current persistence wherever possible

## Current-State Verification

### Job Seeker

What exists now:

- Resume upload with parsing and stored structured data
- Resume analysis with ATS, keyword match, and overall score
- AI-generated analysis and enhancement reports
- Job search with fit scoring against a selected resume
- SmartSend with SMTP connection, AI email generation, campaigns, batch send, and send history
- AI interview sessions with question generation, answer evaluation, and final scoring
- Dashboard with resume, saved job, report, and interview metrics

What is partial:

- Resume analysis is split between deterministic analysis output and a separate AI report experience
- CV improvement exists as a generated report, not as a guided editor flow
- Job matching shows fit and keywords, but not a fully productized "why you match" and "how to improve" layer
- SmartSend tracks sent and failed outcomes, but not replies
- Dashboard does not surface the exact product KPIs required for the final journey

What is missing:

- A single guided flow from upload to interview practice
- Section-level ATS scoring for skills, experience, and education as first-class data
- Proper "Improve CV" entry point from analysis
- Improved CV editor and `.docx` export
- Reply tracking for outreach

### Recruiter

What exists now:

- Recruiter role and gated recruiter workspace
- Candidate CV upload and parsing
- Stored candidate analysis
- Job posting and candidate-job ranking
- Candidate stage tracking with `new`, `shortlisted`, `interview`, `rejected`
- Candidate detail view with preview, skills, analysis, and per-job recommendations
- Bulk analysis trigger

What is partial:

- Candidate profile is useful but not organized like a mini ATS profile
- Pipeline exists at the data level, but not yet as a stronger ATS workflow
- Ranking exists, but top-candidate reasoning is not standardized across views
- Notes are local UI state, not persisted

What is missing:

- Recruiter-side interview invite flow
- Interview session link sending workflow
- Bulk stage moves
- Bulk interview invites
- A direct application object linking a job seeker to recruiter ATS workflows

### Shared System

What exists now:

- Shared `Resume` storage
- Shared `Analysis` table
- Shared job description and interview infrastructure

What is partial:

- Matching is not fully standardized across job seeker and recruiter flows
- AI report output is not reusable across both sides as normalized product data

What is missing:

- A common reusable analysis contract
- A shared application handoff between job seeker and recruiter

## Productized Job Seeker Journey

The target experience should become one guided journey using the current feature base.

### Step 1: Upload CV

Use current base:

- Existing resume upload and parsing flow

Product behavior:

- Upload becomes the first guided onboarding step
- After successful parsing, route the user directly into analysis instead of leaving the next step implicit
- If multiple resumes exist, ask the user to set one as the active resume for downstream actions

Required UI components:

- Upload card
- Parsing progress state
- Resume summary card
- Extracted profile preview: name, target role, top skills, years of experience
- Primary CTA: `Analyze CV`

Backend behavior:

- Keep current upload, extraction, and parsing services
- Add a lightweight "active resume" preference per user or derive it from the most recent completed upload

### Step 2: Analyze CV

Use current base:

- Existing `Analysis` flow
- Existing AI report generation

Product behavior:

- Present one unified result screen called `CV Analysis`
- Show ATS as a top-level product card
- Normalize analysis output so users see one complete interpretation instead of separate tools

Required UI components:

- ATS score hero card with 0-100 score
- Section score cards: `Skills`, `Experience`, `Education`
- Strengths panel
- Weaknesses panel
- Actionable improvements checklist
- Match readiness card
- Primary CTA: `Improve CV`
- Secondary CTA: `Match with Jobs`

Backend behavior:

- Continue storing completed analysis in `analyses`
- Extend `result_payload` to include:
  - `ats.overall_score`
  - `ats.section_scores.skills`
  - `ats.section_scores.experience`
  - `ats.section_scores.education`
  - `strengths`
  - `weaknesses`
  - `improvements`
- Keep current fields for backward compatibility
- Continue storing free-form AI reports in `ai_analysis_reports`, but treat them as narrative support, not the primary contract

### Step 3: Improve CV

Use current base:

- Existing enhancement report generation
- Existing rewrite suggestion capability

Product behavior:

- `Improve CV` becomes a clear CTA from the analysis screen
- The user lands in an `AI CV Editor` experience
- The editor opens with the current parsed CV content plus AI rewrite suggestions
- The user can accept section-by-section changes or apply a full rewrite draft
- Download options include `.docx`

Required UI components:

- CV editor shell
- Section tabs: `Summary`, `Experience`, `Skills`, `Education`
- Side-by-side compare view: `Current` vs `AI Improved`
- Accept/reject suggestion actions
- Full rewrite CTA
- Download CTA: `Download .docx`
- Save as active resume CTA

Backend behavior:

- Reuse existing rewrite generation logic
- Add a structured rewrite response format per section instead of markdown-only output
- Store improved text as a new revision linked to the same resume or as a child version
- Add document export service for `.docx`

### Step 4: Match with Jobs

Use current base:

- Existing job search
- Existing fit scoring
- Existing job save flow

Product behavior:

- `Job Search` becomes the productized `Match Jobs` step
- Every result card should explain why the job matches this resume
- The user should see how to improve the match before applying

Required UI components:

- Search and filters bar
- Match score badge
- `Why you match` panel
- `Missing signals` panel
- `How to improve match` suggestions
- Save job action
- Apply action
- SmartSend action
- Practice interview action

Backend behavior:

- Keep current search provider integration
- Standardize job match response to include:
  - `match_score`
  - `match_reasons`
  - `missing_keywords`
  - `experience_alignment`
  - `improvement_suggestions`
- Reuse the same normalized match contract for recruiter ranking

### Step 5: Apply / Send CV

Use current base:

- Existing SmartSend campaigns and SMTP sending
- Existing save job and apply-link behavior

Product behavior:

- SmartSend becomes a campaign product, not just a compose form
- Users can select multiple companies or jobs, generate email variants, choose a resume version, and send in batches
- Campaigns should expose clear status tracking

Required UI components:

- Campaign builder
- Company or job selection list
- Resume selector
- Email variant generator
- Batch review table
- Send progress panel
- Campaign history table with `Sent`, `Failed`, `Replied`

Backend behavior:

- Keep `send_campaigns` and `send_logs`
- Extend logs and campaign aggregates to support reply-state tracking
- Attach job or company context to campaign recipients when available
- Add application event recording so dashboard metrics can show `applications sent`

### Step 6: Practice Interview

Use current base:

- Existing AI interview generation and evaluation

Product behavior:

- AI interview becomes the final guided step after job matching or sending
- Questions should be based on the selected resume and optionally the selected target job
- Final output should express readiness clearly

Required UI components:

- Interview setup form
- Generated question list
- Session workspace
- Per-answer feedback card
- Final score card
- Interview readiness score card
- Improvement drills panel

Backend behavior:

- Keep `interview_sessions`
- Normalize final report for dashboard reuse:
  - `overall_score`
  - `readiness_score`
  - `strengths`
  - `weaknesses`
  - `recommended_drills`

### Job Seeker Dashboard

The dashboard should become a progress dashboard, not just a metrics shelf.

Required dashboard cards:

- ATS Score
- Jobs Matched
- Applications Sent
- Interview Readiness Score

Required supporting modules:

- Active resume summary
- Current step tracker
- Recent applications or campaigns
- Recommended next action

## Productized Recruiter Experience

The recruiter side should become a focused mini ATS built on the current upload, parsing, matching, and candidate analysis system.

### Recruiter Flow

1. Create or open a job
2. Upload or ingest candidate CVs
3. Parse and analyze candidates
4. Rank candidates automatically
5. Manage them in pipeline stages
6. Review candidate profiles
7. Invite selected candidates to interview

### Recruiter Jobs Page

Use current base:

- Existing job posting and jobs listing

Required UI components:

- Job creation form
- Jobs table or cards
- Candidate count per job
- Top candidates preview
- Pipeline summary by stage
- CTA: `View Candidates`

Backend behavior:

- Keep current job models and endpoints
- Add stage summary aggregates per job

### Candidate Pipeline Page

Use current base:

- Existing recruiter candidate list
- Existing `recruiter_stage`

Product behavior:

- Present pipeline as ATS stages:
  - `Applied`
  - `Shortlisted`
  - `Interview`
  - `Rejected`
- Map `Applied` to the current backend enum value `new` first, then migrate later only if needed

Required UI components:

- Pipeline board or grouped list
- Bulk selection toolbar
- Stage move action
- Bulk analyze action
- Bulk invite action
- Candidate row cards with score, match, and latest analysis state

Backend behavior:

- Keep current stage field
- Add bulk transition endpoint
- Keep existing single-candidate stage updates intact

### Candidate Profile

Use current base:

- Existing candidate detail view
- Existing stored analysis payload

Product behavior:

- Candidate profile becomes the ATS detail screen
- The profile should expose recruiter-ready hiring signals immediately

Required UI components:

- Candidate identity header
- Extracted name
- Contact info
- Skills card
- Experience summary card
- AI score card
- Match score with current job
- Strengths panel
- Weaknesses panel
- Fit summary
- Resume preview
- Notes panel
- Stage action controls
- CTA: `Send Interview Invite`

Backend behavior:

- Surface parsed candidate name as first-class display data
- Surface structured experience summary in the API response
- Keep stored analysis results and never regenerate unless explicitly requested
- Persist recruiter notes in backend storage

### Matching and Top Candidates

Use current base:

- Existing recruiter job ranking

Product behavior:

- Matching should rank candidates with a shared score contract
- Every top-candidate view should explain why the candidate is a fit

Required UI components:

- Top candidates leaderboard
- Score and percentile badge
- `Why matched` explanation bullets
- Gaps or risks bullets
- Recommended next action

Backend behavior:

- Reuse the normalized match schema from the job seeker side
- Keep deeper GPT analysis as an enrichment layer, not a different product contract

### AI Candidate Analysis

Use current base:

- Existing stored recruiter analysis

Product behavior:

- Every candidate analysis should be reusable and visible as a stable snapshot
- The recruiter should see strengths, weaknesses, and fit score without re-running analysis

Required UI components:

- Latest analysis summary card
- Analysis freshness badge
- Re-run analysis action
- Structured tabs: `Strengths`, `Weaknesses`, `Fit`, `Job Match`

Backend behavior:

- Continue storing completed analysis results
- Add normalized fields if missing:
  - `fit_score`
  - `strengths`
  - `weaknesses`
  - `match_reasons`

### Recruiter Interview Workflow

Use current base:

- Existing interview generation engine

Product behavior:

- Recruiters can generate interview questions for a candidate against a specific job
- Recruiters can send an interview invite email containing a session link

Required UI components:

- Generate interview kit button
- Interview question preview
- Invite modal
- Candidate email confirmation
- Session link panel
- Invite status badge

Backend behavior:

- Reuse question-generation logic from the current interview service
- Add recruiter-owned interview invitation records
- Add session-link generation bound to candidate and job context
- Reuse existing SMTP infrastructure where possible

### Bulk Actions

Required bulk actions:

- Analyze selected candidates
- Move selected candidates to a stage
- Send interview invites to selected candidates

Backend behavior:

- Add bulk endpoints around existing single-item operations
- Do not remove existing single-item endpoints

## Shared System Integration

Both experiences should use the same core entities and scoring language.

### Shared Product Rules

- A job seeker CV must be promotable into a recruiter-usable candidate record
- Matching logic must return the same normalized explanation shape across both experiences
- Analysis should be reusable, cached, and visible without re-running by default

### Shared Data Flow

1. Resume upload creates or updates a canonical `Resume`
2. Parsing stores normalized `structured_data`
3. Analysis writes a normalized score snapshot into `Analysis.result_payload`
4. AI reports remain available as narrative detail, not as the primary integration contract
5. Job matching consumes the canonical resume profile and a job description
6. SmartSend or Apply actions create an application or outreach record
7. Recruiter ATS can consume the same candidate profile, match snapshot, and interview context

### Shared Matching Contract

Standardize one response shape for both job seeker and recruiter flows:

- `match_score`
- `match_reasons`
- `missing_keywords`
- `experience_alignment`
- `fit_summary`
- `improvement_suggestions`

### Shared Analysis Contract

Standardize one reusable analysis shape:

- `overall_score`
- `ats.overall_score`
- `ats.section_scores`
- `strengths`
- `weaknesses`
- `improvements`
- `fit_score`
- `recommendation`

## Backend Change Plan

These changes keep the current system intact and add product structure on top.

### Change Without Breaking Existing Logic

- Keep `Resume` as the canonical resume record
- Keep `Analysis` as the canonical persisted analysis snapshot
- Keep `AIAnalysisReport` for long-form narrative output
- Keep `InterviewSession` for interactive interview state
- Keep `SendCampaign` and `SendLog` for outbound email execution
- Extend API responses instead of replacing current keys
- Add new fields to `result_payload` rather than introducing a new parallel analysis store
- Add new endpoints only for aggregation, bulk actions, and normalized read models

### Backend Additions That Are Necessary

1. `applications` or `candidate_job_links`

Needed because:

- There is currently no formal object connecting a job seeker action to recruiter ATS workflows
- This is the cleanest way to make job seeker CVs recruiter-usable

Recommended fields:

- `user_id`
- `resume_id`
- `job_description_id`
- `source`
- `status`
- `applied_at`
- `campaign_id` if sent through SmartSend

2. Resume revision or improved-document layer

Needed because:

- The platform can generate rewrites, but it cannot yet manage an improved CV lifecycle

Recommended fields:

- `resume_id`
- `source_analysis_id`
- `version_label`
- `content_json`
- `docx_storage_key`
- `is_active`

3. Reply tracking fields for SmartSend

Needed because:

- `Replied` is a required product status and does not exist today

Recommended direction:

- Extend send logs with reply metadata
- Support manual reply marking first
- Add mailbox sync or webhook integration later if product scope allows

4. Recruiter notes persistence

Needed because:

- Notes are currently local-only and not shared across sessions or teammates

Recommended fields:

- `candidate_id`
- `job_id`
- `author_id`
- `body`

5. Interview invitation records

Needed because:

- Recruiter interview flow requires sending and tracking invites

Recommended fields:

- `candidate_id`
- `job_id`
- `session_id`
- `email_status`
- `sent_at`
- `opened_at`
- `completed_at`

### Optional Later Enhancements

- Rename backend stage enum from `new` to `applied` after UI rollout stabilizes
- Add inbox sync for automatic SmartSend reply detection
- Add scoring versioning if the ranking algorithm will evolve frequently

## Required UI Surfaces by Page

### Job Seeker Pages

- `Dashboard`: progress KPIs, active resume, next step, recent activity
- `Resume Upload`: upload card, parser preview, active resume selector
- `CV Analysis`: ATS hero, section scores, strengths, weaknesses, improvements
- `AI CV Editor`: section editor, rewrite compare, download actions
- `Match Jobs`: search, filters, match cards, why-match, improvement suggestions
- `SmartSend Campaigns`: campaign builder, recipient list, variant chooser, send tracking
- `AI Interview`: setup, live session, evaluation, readiness report

### Recruiter Pages

- `Recruiter Dashboard`: open jobs, pipeline counts, top matches, pending invites
- `Jobs`: create job, job list, candidate counts, top candidates
- `Candidate Pipeline`: grouped stages, bulk actions, quick filters
- `Candidate Profile`: identity, skills, experience, scores, notes, stage actions, invite action
- `Interview Invites`: generated question set, invite status, completion state

## Delivery Sequence

Recommended implementation order:

1. Normalize shared analysis and matching contracts
2. Reframe the job seeker flow around one guided journey
3. Add CV improvement editor and improved CV export
4. Add dashboard KPI aggregation
5. Strengthen recruiter candidate profile and pipeline actions
6. Add application handoff between job seeker and recruiter
7. Add recruiter interview invite flow
8. Add SmartSend reply tracking

This order gives the product a coherent shape quickly while preserving current functionality throughout the rollout.
