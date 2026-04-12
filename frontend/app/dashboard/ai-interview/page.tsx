"use client";

import { useCallback, useEffect, useState } from "react";

import { InterviewAnswerComposer } from "@/components/interview-answer-composer";
import { Panel } from "@/components/panel";
import { ApiError } from "@/lib/api";
import { completeInterview, getInterview, listInterviews, startInterview, submitAnswer } from "@/lib/interviews";
import { listResumes } from "@/lib/resumes";
import type {
  AnswerEvaluation,
  ExperienceLevel,
  InterviewCompleteResponse,
  InterviewContextSummary,
  InterviewListItem,
  InterviewQuestion,
  InterviewType,
  InterviewerStyle,
  QuestionCount,
  ResumeListItem,
} from "@/types";

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level (0-2 yrs)" },
  { value: "mid", label: "Mid Level (3-5 yrs)" },
  { value: "senior", label: "Senior Level (6+ yrs)" },
];
const INTERVIEW_TYPES: { value: InterviewType; label: string }[] = [
  { value: "hr", label: "HR Interview" },
  { value: "technical", label: "Technical Interview" },
  { value: "mixed", label: "Mixed Interview" },
];
const QUESTION_COUNTS: QuestionCount[] = [3, 5, 10];
const INTERVIEWER_STYLES: { value: InterviewerStyle; label: string; desc: string }[] = [
  { value: "supportive", label: "Supportive", desc: "Warm and coaching" },
  { value: "direct", label: "Direct", desc: "Concise and executive" },
  { value: "challenging", label: "Challenging", desc: "Pushes for evidence" },
];

type PageState = "setup" | "generating" | "interviewing" | "evaluating" | "completing" | "completed";
type SetupValues = {
  jobTitle: string;
  level: ExperienceLevel;
  type: InterviewType;
  language: "en" | "ar";
  count: QuestionCount;
  resumeId: string;
  companyName: string;
  jobDescription: string;
  interviewerStyle: InterviewerStyle;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function styleLabel(style: InterviewerStyle | null | undefined): string {
  return style === "challenging" ? "Challenging" : style === "direct" ? "Direct" : "Supportive";
}

function styleClass(style: InterviewerStyle | null | undefined): string {
  return style === "challenging"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : style === "direct"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function typeClass(type: string): string {
  return type === "technical" ? "border-purple-200 bg-purple-50 text-purple-700" : "border-blue-200 bg-blue-50 text-blue-700";
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-slate-600">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${score >= 7.5 ? "bg-emerald-500" : score >= 5 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${Math.round((score / 10) * 100)}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-slate-700">{score.toFixed(1)}</span>
    </div>
  );
}

function ContextChips({ context }: { context: InterviewContextSummary | null }) {
  if (!context) return null;
  const chips = [
    context.resume_title ? `Resume: ${context.resume_title}` : null,
    context.company_name ? `Company: ${context.company_name}` : null,
    context.has_job_description ? "JD loaded" : null,
  ].filter(Boolean) as string[];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styleClass(context.interviewer_style)}`}>{styleLabel(context.interviewer_style)} interviewer</span>
      {chips.map((chip) => (
        <span key={chip} className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">{chip}</span>
      ))}
    </div>
  );
}

export default function DashboardAiInterviewPage() {
  const [setup, setSetup] = useState<SetupValues>({
    jobTitle: "",
    level: "mid",
    type: "mixed",
    language: "en",
    count: 5,
    resumeId: "",
    companyName: "",
    jobDescription: "",
    interviewerStyle: "supportive",
  });
  const [pageState, setPageState] = useState<PageState>("setup");
  const [pageError, setPageError] = useState("");
  const [answerError, setAnswerError] = useState("");
  const [answerMode, setAnswerMode] = useState<"text" | "video">("text");
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [sessions, setSessions] = useState<InterviewListItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [nextQuestion, setNextQuestion] = useState<InterviewQuestion | null>(null);
  const [openingMessage, setOpeningMessage] = useState<string | null>(null);
  const [contextSummary, setContextSummary] = useState<InterviewContextSummary | null>(null);
  const [completedSession, setCompletedSession] = useState<InterviewCompleteResponse | null>(null);

  const loadHistory = useCallback(async () => {
    try { setSessions(await listInterviews()); } catch {}
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);
  useEffect(() => {
    void listResumes().then((items) => {
      setResumes(items);
      if (items.length > 0) setSetup((prev) => ({ ...prev, resumeId: prev.resumeId || items[0]!.id }));
    }).catch(() => {});
  }, []);

  // Pre-fill from Analysis or Job Search navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const jd = sessionStorage.getItem("jobai_interview_jd");
    const title = sessionStorage.getItem("jobai_interview_jd_title");
    if (jd) {
      setSetup((prev) => ({
        ...prev,
        jobDescription: jd,
        jobTitle: title || prev.jobTitle,
      }));
      sessionStorage.removeItem("jobai_interview_jd");
      sessionStorage.removeItem("jobai_interview_jd_title");
    }
  }, []);

  async function handleStart() {
    setPageError("");
    setPageState("generating");
    try {
      const session = await startInterview({
        job_title: setup.jobTitle.trim(),
        experience_level: setup.level,
        interview_type: setup.type,
        language: setup.language,
        question_count: setup.count,
        resume_id: setup.resumeId || undefined,
        company_name: setup.companyName.trim() || undefined,
        job_description: setup.jobDescription.trim() || undefined,
        interviewer_style: setup.interviewerStyle,
      });
      setSessionId(session.id);
      setQuestionCount(session.question_count);
      setQuestions(session.questions);
      setCurrentIndex(0);
      setCurrentAnswer("");
      setCurrentEvaluation(null);
      setNextQuestion(null);
      setOpeningMessage(session.opening_message ?? null);
      setContextSummary(session.context_summary ?? null);
      setCompletedSession(null);
      setPageState("interviewing");
    } catch (error) {
      setPageError(error instanceof ApiError ? error.detail : "Failed to prepare the interview.");
      setPageState("setup");
    }
  }

  async function handleSubmitAnswer() {
    const currentQuestion = questions[currentIndex];
    if (!sessionId || !currentQuestion || !currentAnswer.trim()) return;
    setAnswerError("");
    setPageState("evaluating");
    try {
      const result = await submitAnswer(sessionId, currentIndex, currentQuestion.question, currentAnswer.trim());
      setCurrentEvaluation(result.evaluation);
      setQuestions(result.questions);
      setNextQuestion(result.next_question);
      setPageState("interviewing");
    } catch (error) {
      setAnswerError(error instanceof ApiError ? error.detail : "Evaluation failed.");
      setPageState("interviewing");
    }
  }

  async function handleNext() {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setCurrentAnswer("");
      setCurrentEvaluation(null);
      setNextQuestion(null);
      return;
    }
    if (!sessionId) return;
    setPageState("completing");
    try {
      const result = await completeInterview(sessionId);
      setCompletedSession(result);
      setPageState("completed");
      void loadHistory();
    } catch (error) {
      setPageError(error instanceof ApiError ? error.detail : "Failed to generate final report.");
      setPageState("interviewing");
    }
  }

  function handleRetry() {
    const isActive = pageState === "interviewing" || pageState === "evaluating";
    if (isActive && !window.confirm("End this session? Your progress will be lost.")) return;
    setPageState("setup");
    setPageError("");
    setAnswerError("");
    setAnswerMode("text");
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setCurrentEvaluation(null);
    setNextQuestion(null);
    setOpeningMessage(null);
    setContextSummary(null);
    setCompletedSession(null);
  }

  async function handleViewHistory(id: string) {
    setHistoryLoading(true);
    try {
      const session = await getInterview(id);
      setOpeningMessage(session.opening_message ?? null);
      setContextSummary(session.context_summary ?? null);

      if (session.status === "active") {
        // Resume the unfinished session
        const answeredCount = (session.answers ?? []).length;
        setSessionId(session.id);
        setQuestionCount(session.question_count);
        setQuestions(session.questions);
        setCurrentIndex(answeredCount);
        setCurrentAnswer("");
        setCurrentEvaluation(null);
        setNextQuestion(null);
        setCompletedSession(null);
        setSetup((prev) => ({
          ...prev,
          jobTitle: session.job_title,
          level: session.experience_level as typeof prev.level,
          type: session.interview_type as typeof prev.type,
          language: session.language as typeof prev.language,
          count: session.question_count as typeof prev.count,
        }));
        setPageState("interviewing");
      } else {
        setCompletedSession(session);
        setPageState("completed");
      }
    } finally {
      setHistoryLoading(false);
    }
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Tools</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">AI Interview</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">A more realistic mock interview: role-aware, resume-aware, and adaptive to your answers.</p>
      </div>

      {pageState === "setup" && sessions.some((s) => s.status === "active") && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">You have an unfinished session</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sessions.filter((s) => s.status === "active").map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={historyLoading}
                onClick={() => void handleViewHistory(s.id)}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {s.job_title} — {s.question_count}Q
              </button>
            ))}
          </div>
        </div>
      )}

      {(pageState === "setup" || pageState === "generating") && (
        <Panel className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Configure</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Set up a real interview simulation</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <input value={setup.jobTitle} onChange={(e) => setSetup((p) => ({ ...p, jobTitle: e.target.value }))} placeholder="Job Title" className="md:col-span-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
            <select value={setup.resumeId} onChange={(e) => setSetup((p) => ({ ...p, resumeId: e.target.value }))} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm">
              <option value="">No resume context</option>
              {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.source_filename ?? resume.title}</option>)}
            </select>
            <input value={setup.companyName} onChange={(e) => setSetup((p) => ({ ...p, companyName: e.target.value }))} placeholder="Company Name (optional)" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
            <div className="space-y-2">{EXPERIENCE_LEVELS.map((item) => <label key={item.value} className="flex items-center gap-2 text-sm"><input type="radio" checked={setup.level === item.value} onChange={() => setSetup((p) => ({ ...p, level: item.value }))} />{item.label}</label>)}</div>
            <div className="space-y-2">{INTERVIEW_TYPES.map((item) => <label key={item.value} className="flex items-center gap-2 text-sm"><input type="radio" checked={setup.type === item.value} onChange={() => setSetup((p) => ({ ...p, type: item.value }))} />{item.label}</label>)}</div>
            <div className="flex gap-3">{(["en", "ar"] as const).map((language) => <label key={language} className="flex items-center gap-2 text-sm"><input type="radio" checked={setup.language === language} onChange={() => setSetup((p) => ({ ...p, language }))} />{language === "en" ? "English" : "Arabic"}</label>)}</div>
            <div className="flex gap-3">{QUESTION_COUNTS.map((count) => <button key={count} type="button" onClick={() => setSetup((p) => ({ ...p, count }))} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${setup.count === count ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{count}</button>)}</div>
            <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
              {INTERVIEWER_STYLES.map((style) => <button key={style.value} type="button" onClick={() => setSetup((p) => ({ ...p, interviewerStyle: style.value }))} className={`rounded-2xl border p-4 text-left ${setup.interviewerStyle === style.value ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}><p className="text-sm font-semibold">{style.label}</p><p className={`mt-2 text-xs ${setup.interviewerStyle === style.value ? "text-slate-200" : "text-slate-500"}`}>{style.desc}</p></button>)}
            </div>
            <textarea value={setup.jobDescription} onChange={(e) => setSetup((p) => ({ ...p, jobDescription: e.target.value }))} rows={6} placeholder="Paste job description (optional but recommended)" className="md:col-span-2 rounded-xl border border-slate-300 px-4 py-3 text-sm" />
          </div>
          {pageError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</div>}
          <button type="button" disabled={!setup.jobTitle.trim() || pageState === "generating"} onClick={() => void handleStart()} className="mt-6 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{pageState === "generating" ? "Preparing interviewer..." : "Start AI Interview"}</button>
        </Panel>
      )}

      {(pageState === "interviewing" || pageState === "evaluating" || pageState === "completing") && currentQuestion && (
        <Panel className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{setup.jobTitle}</p>
              <p className="text-xs text-slate-400">Question {currentIndex + 1} of {questionCount}</p>
            </div>
            <button type="button" onClick={handleRetry} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500">End Session</button>
          </div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: questionCount }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < currentIndex ? "bg-slate-700" : i === currentIndex ? "bg-blue-500" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {openingMessage && currentIndex === 0 && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{openingMessage}</div>}
            <ContextChips context={contextSummary} />
            {contextSummary?.target_role_summary && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{contextSummary.target_role_summary}</div>}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeClass(currentQuestion.type)}`}>{currentQuestion.type === "technical" ? "Technical" : "Behavioral"}</span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">{currentQuestion.source === "follow_up" ? "Follow-up" : currentQuestion.source === "planned" ? "Planned" : "Opening"}</span>
              {currentQuestion.focus_area && <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">{currentQuestion.focus_area}</span>}
            </div>
            <p className="text-base font-semibold leading-snug text-slate-900">{currentQuestion.question}</p>
          </div>
          {!currentEvaluation ? (
            <InterviewAnswerComposer
              answerMode={answerMode}
              onAnswerModeChange={setAnswerMode}
              answerValue={currentAnswer}
              onAnswerChange={setCurrentAnswer}
              language={setup.language}
              questionKey={`${sessionId ?? "session"}:${currentIndex}:${currentQuestion.index}`}
              isSubmitting={pageState === "evaluating"}
              error={answerError}
              onSubmit={() => void handleSubmitAnswer()}
            />
          ) : (
            <div className="mt-5 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Interviewer Reply</p><p className="mt-2">{currentEvaluation.interviewer_reply}</p></div>
              <div className={`rounded-xl border px-4 py-3 ${currentEvaluation.score >= 7.5 ? "border-emerald-200 bg-emerald-50" : currentEvaluation.score >= 5 ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Answer Score</p><p className="mt-2 text-2xl font-bold">{currentEvaluation.score.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></p></div>
              {currentEvaluation.communication_tip && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Coaching Tip</p><p className="mt-2">{currentEvaluation.communication_tip}</p></div>}
              {currentEvaluation.strengths.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">Strengths</p><ul className="space-y-1.5 text-sm text-slate-700">{currentEvaluation.strengths.map((item) => <li key={item}>+ {item}</li>)}</ul></div>}
              {currentEvaluation.weaknesses.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-700">Improvements</p><ul className="space-y-1.5 text-sm text-slate-700">{currentEvaluation.weaknesses.map((item) => <li key={item}>-&gt; {item}</li>)}</ul></div>}
              {currentEvaluation.improved_answer && <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Suggested Stronger Answer</p><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">{currentEvaluation.improved_answer}</div></div>}
              {nextQuestion && <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800"><p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">Next Question Ready</p><p className="mt-2">{nextQuestion.question}</p></div>}
              <button type="button" disabled={pageState === "completing"} onClick={() => void handleNext()} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pageState === "completing" ? "Generating final report..." : currentIndex + 1 >= questionCount ? "View Final Report" : "Next Question ->"}</button>
            </div>
          )}
        </Panel>
      )}

      {pageState === "completed" && completedSession && (
        <div className="space-y-5">
          <Panel className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Final Report</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{completedSession.job_title}</h2>
                <p className="mt-2 text-xs text-slate-500">{completedSession.question_count} questions - {formatDate(completedSession.created_at)}</p>
              </div>
              <div className="text-right text-2xl font-bold text-slate-900">{completedSession.overall_score.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></div>
            </div>
            {completedSession.context_summary && <div className="mt-4"><ContextChips context={completedSession.context_summary} /></div>}
            {completedSession.final_report?.summary && <p className="mt-4 text-sm leading-7 text-slate-600">{completedSession.final_report.summary}</p>}
            {completedSession.final_report?.breakdown && <div className="mt-5 space-y-2.5"><ScoreBar label="Relevance" score={completedSession.final_report.breakdown.relevance} /><ScoreBar label="Clarity" score={completedSession.final_report.breakdown.clarity} /><ScoreBar label="Professionalism" score={completedSession.final_report.breakdown.professionalism} /><ScoreBar label="Confidence" score={completedSession.final_report.breakdown.confidence} /><ScoreBar label="Role Fit" score={completedSession.final_report.breakdown.role_fit} /></div>}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Top Strengths</p><ul className="mt-3 space-y-2 text-sm text-emerald-900">{(completedSession.final_report?.top_strengths ?? []).map((item: string) => <li key={item}>+ {item}</li>)}</ul></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Priority Improvements</p><ul className="mt-3 space-y-2 text-sm text-amber-900">{(completedSession.final_report?.priority_improvements ?? []).map((item: string) => <li key={item}>-&gt; {item}</li>)}</ul></div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-sky-700">Recommended Drills</p><ul className="mt-3 space-y-2 text-sm text-sky-900">{(completedSession.final_report?.recommended_drills ?? []).map((item: string) => <li key={item}>• {item}</li>)}</ul></div>
            </div>
            <button type="button" onClick={handleRetry} className="mt-6 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700">Practice Again</button>
          </Panel>
        </div>
      )}

      {(pageState === "setup" || pageState === "completed") && (
        <Panel className="overflow-hidden">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Past Sessions</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{sessions.length} saved session{sessions.length !== 1 ? "s" : ""}</h2>
          </div>
          {sessions.length === 0 ? (
            <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">No sessions yet. Complete your first AI interview above.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-y border-slate-100 bg-slate-50"><th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Role</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Type</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Score</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Date</th><th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4"><p className="font-medium text-slate-900">{session.job_title}</p><p className="mt-0.5 text-xs text-slate-400">{session.question_count}Q</p></td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeClass(session.interview_type)}`}>{session.interview_type}</span></td>
                      <td className="px-4 py-4">{session.overall_score != null ? <span className="text-sm font-semibold text-slate-700">{session.overall_score.toFixed(1)}/10</span> : <span className="text-xs text-slate-400">-</span>}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(session.created_at)}</td>
                      <td className="px-6 py-4 text-right"><button type="button" disabled={session.status !== "completed" || historyLoading} onClick={() => void handleViewHistory(session.id)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">Review</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
