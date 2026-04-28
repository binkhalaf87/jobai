"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { InterviewAnswerComposer } from "@/components/interview-answer-composer";
import { Panel } from "@/components/panel";
import { ApiError } from "@/lib/api";
import { completeInterview, extractStreamingReply, getInterview, listInterviews, startInterview, submitAnswer, submitAnswerStream } from "@/lib/interviews";
import { listJobDescriptions } from "@/lib/job-descriptions";
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
  JobDescriptionListItem,
  QuestionCount,
  ResumeListItem,
} from "@/types";

const EXPERIENCE_LEVEL_VALUES: ExperienceLevel[] = ["entry", "mid", "senior"];
const INTERVIEW_TYPE_VALUES: InterviewType[] = ["hr", "technical", "mixed"];
const QUESTION_COUNTS: QuestionCount[] = [3, 5, 10];
const INTERVIEWER_STYLE_VALUES: InterviewerStyle[] = ["supportive", "direct", "challenging"];

const WEEKLY_CHALLENGES = [
  { jobTitle: "Frontend Engineer", type: "technical" as InterviewType, level: "mid" as ExperienceLevel, focus: "React, TypeScript, performance & system design" },
  { jobTitle: "Product Manager", type: "hr" as InterviewType, level: "mid" as ExperienceLevel, focus: "Stakeholder management, product vision & prioritization" },
  { jobTitle: "Data Scientist", type: "mixed" as InterviewType, level: "mid" as ExperienceLevel, focus: "ML modelling, data analysis & business storytelling" },
  { jobTitle: "UX Designer", type: "hr" as InterviewType, level: "entry" as ExperienceLevel, focus: "User research, wireframing & design thinking" },
  { jobTitle: "DevOps Engineer", type: "technical" as InterviewType, level: "senior" as ExperienceLevel, focus: "CI/CD, Kubernetes, cloud infrastructure & incident response" },
  { jobTitle: "Sales Manager", type: "hr" as InterviewType, level: "mid" as ExperienceLevel, focus: "Revenue growth, team leadership & forecasting" },
  { jobTitle: "Backend Engineer", type: "technical" as InterviewType, level: "senior" as ExperienceLevel, focus: "Microservices, database design & high-scale systems" },
  { jobTitle: "Marketing Manager", type: "mixed" as InterviewType, level: "mid" as ExperienceLevel, focus: "Growth campaigns, SEO/SEM & performance analytics" },
];

const WEAKNESS_TYPE_CLASS: Record<string, string> = {
  vague: "border-amber-200 bg-amber-50 text-amber-700",
  missing_example: "border-orange-200 bg-orange-50 text-orange-700",
  technical_gap: "border-rose-200 bg-rose-50 text-rose-700",
  off_topic: "border-red-200 bg-red-50 text-red-700",
  strong: "border-teal-light bg-teal-light/30 text-teal",
};

type PageState = "setup" | "generating" | "brief" | "interviewing" | "evaluating" | "completing" | "completed";
type TimerDuration = 0 | 60 | 120 | 180;

type SavedQuestion = {
  id: string;
  question: string;
  type: "hr" | "technical";
  focus_area: string | null;
  job_title: string;
  saved_at: string;
};

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
  timerDuration: TimerDuration;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function styleKey(style: InterviewerStyle | null | undefined): string {
  return style === "challenging" ? "styles.challenging" : style === "direct" ? "styles.direct" : "styles.supportive";
}

function styleClass(style: InterviewerStyle | null | undefined): string {
  return style === "challenging"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : style === "direct"
      ? "border-slate-200 bg-slate-100 text-slate-700"
      : "border-teal-light bg-teal-light/30 text-teal";
}

function typeClass(type: string): string {
  return type === "technical" ? "border-brand-200 bg-brand-50 text-brand-700" : "border-brand-200 bg-brand-50 text-brand-700";
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-slate-600">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${score >= 7.5 ? "bg-teal" : score >= 5 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${Math.round((score / 10) * 100)}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-slate-700">{score.toFixed(1)}</span>
    </div>
  );
}

function ContextChips({ context }: { context: InterviewContextSummary | null }) {
  const t = useTranslations("aiInterviewPage");
  if (!context) return null;
  const chips = [
    context.resume_title ? t("session.resumeChip", { title: context.resume_title }) : null,
    context.company_name ? t("session.companyChip", { name: context.company_name }) : null,
    context.has_job_description ? t("session.jdLoadedChip") : null,
  ].filter(Boolean) as string[];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styleClass(context.interviewer_style)}`}>
        {t("session.interviewerStyle", { style: t(styleKey(context.interviewer_style)) })}
      </span>
      {chips.map((chip) => (
        <span key={chip} className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">{chip}</span>
      ))}
    </div>
  );
}

export default function DashboardAiInterviewPage() {
  const t = useTranslations("aiInterviewPage");
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
    timerDuration: 0,
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
  const [answerScores, setAnswerScores] = useState<Record<number, number>>({});
  const [streamingReply, setStreamingReply] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescriptionListItem[]>([]);
  const [showAnswerPreview, setShowAnswerPreview] = useState(false);
  const [videoRecordings, setVideoRecordings] = useState<Record<number, string>>({});
  const weeklyChallenge = WEEKLY_CHALLENGES[Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % WEEKLY_CHALLENGES.length]!;
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("jobai_question_bank") ?? "[]") as SavedQuestion[]; }
    catch { return []; }
  });

  const loadHistory = useCallback(async () => {
    try { setSessions(await listInterviews()); } catch {}
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);
  useEffect(() => {
    void listResumes().then((items) => {
      setResumes(items);
      if (items.length > 0) setSetup((prev) => ({ ...prev, resumeId: prev.resumeId || items[0]!.id }));
    }).catch(() => {});
    void listJobDescriptions().then(setJobDescriptions).catch(() => {});
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
      setPageState("brief");
    } catch (error) {
      setPageError(error instanceof ApiError ? error.detail : t("failedToStart"));
      setPageState("setup");
    }
  }

  async function handleSubmitAnswer() {
    const currentQuestion = questions[currentIndex];
    if (!sessionId || !currentQuestion || !currentAnswer.trim()) return;
    setAnswerError("");
    setStreamingReply("");
    setPageState("evaluating");
    let accumulatedText = "";
    try {
      const stream = submitAnswerStream(sessionId, currentIndex, currentQuestion.question, currentAnswer.trim());
      for await (const event of stream) {
        if (event.type === "chunk") {
          accumulatedText += event.text;
          const reply = extractStreamingReply(accumulatedText);
          if (reply) setStreamingReply(reply);
        } else if (event.type === "done") {
          setCurrentEvaluation(event.payload.evaluation);
          setQuestions(event.payload.questions);
          setNextQuestion(event.payload.next_question);
          setAnswerScores((prev) => ({ ...prev, [currentIndex]: event.payload.evaluation.score }));
          setStreamingReply("");
          setPageState("interviewing");
        } else if (event.type === "error") {
          throw new Error(event.detail);
        }
      }
    } catch (error) {
      // Fallback to regular endpoint if streaming fails
      try {
        const result = await submitAnswer(sessionId, currentIndex, currentQuestion.question, currentAnswer.trim());
        setCurrentEvaluation(result.evaluation);
        setQuestions(result.questions);
        setNextQuestion(result.next_question);
        setAnswerScores((prev) => ({ ...prev, [currentIndex]: result.evaluation.score }));
        setPageState("interviewing");
      } catch (fallbackError) {
        setAnswerError(fallbackError instanceof ApiError ? fallbackError.detail : t("evaluation.evaluationFailed"));
        setPageState("interviewing");
      }
      void error; // suppress unused warning
    }
    setStreamingReply("");
  }

  async function handleNext() {
    setShowAnswerPreview(false);
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
      setPageError(error instanceof ApiError ? error.detail : t("evaluation.failedFinalReport"));
      setPageState("interviewing");
    }
  }

  function handleRetry() {
    const isActive = pageState === "interviewing" || pageState === "evaluating";
    if (isActive && !window.confirm(t("session.endConfirm"))) return;
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
    setAnswerScores({});
    setShowAnswerPreview(false);
    setVideoRecordings({});
  }

  async function handleViewHistory(id: string) {
    setHistoryLoading(true);
    try {
      const session = await getInterview(id);
      setOpeningMessage(session.opening_message ?? null);
      setContextSummary(session.context_summary ?? null);

      const restoredScores: Record<number, number> = {};
      for (const answer of session.answers ?? []) {
        if (answer.evaluation?.score != null) {
          restoredScores[answer.index] = answer.evaluation.score;
        }
      }
      setAnswerScores(restoredScores);

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

  function handleQuickPractice() {
    setSetup((prev) => ({ ...prev, count: 3 }));
    void (async () => {
      setPageError("");
      setPageState("generating");
      try {
        const session = await startInterview({
          job_title: setup.jobTitle.trim() || weeklyChallenge.jobTitle,
          experience_level: setup.level,
          interview_type: setup.type,
          language: setup.language,
          question_count: 3,
          resume_id: setup.resumeId || undefined,
          company_name: setup.companyName.trim() || undefined,
          job_description: setup.jobDescription.trim() || undefined,
          interviewer_style: setup.interviewerStyle,
        });
        setSessionId(session.id);
        setQuestionCount(3);
        setQuestions(session.questions);
        setCurrentIndex(0);
        setCurrentAnswer("");
        setCurrentEvaluation(null);
        setNextQuestion(null);
        setOpeningMessage(session.opening_message ?? null);
        setContextSummary(session.context_summary ?? null);
        setCompletedSession(null);
        setAnswerScores({});
        setPageState("brief");
      } catch (error) {
        setPageError(error instanceof ApiError ? error.detail : t("failedToStart"));
        setPageState("setup");
      }
    })();
  }

  function getQuestionId(q: InterviewQuestion): string {
    return `${setup.jobTitle}:${q.index}:${q.question.slice(0, 60)}`;
  }

  function toggleSaveQuestion(q: InterviewQuestion) {
    const id = getQuestionId(q);
    const alreadySaved = savedQuestions.some((s) => s.id === id);
    const updated = alreadySaved
      ? savedQuestions.filter((s) => s.id !== id)
      : [...savedQuestions, { id, question: q.question, type: q.type, focus_area: q.focus_area ?? null, job_title: setup.jobTitle, saved_at: new Date().toISOString() }];
    setSavedQuestions(updated);
    localStorage.setItem("jobai_question_bank", JSON.stringify(updated));
  }

  function isQuestionSaved(q: InterviewQuestion): boolean {
    return savedQuestions.some((s) => s.id === getQuestionId(q));
  }

  function removeSavedQuestion(id: string) {
    const updated = savedQuestions.filter((s) => s.id !== id);
    setSavedQuestions(updated);
    localStorage.setItem("jobai_question_bank", JSON.stringify(updated));
  }

  function exportReportPdf() {
    if (!completedSession) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const r = completedSession.final_report;
    const date = new Date(completedSession.created_at).toLocaleDateString();
    const breakdownRows = Object.entries(r.breakdown ?? {})
      .map(([k, v]) => `<div class="bar-row"><span class="lbl">${k.replace(/_/g, " ")}</span><div class="bar" style="width:${Math.round((Number(v) / 10) * 180)}px"></div><span class="bv">${Number(v).toFixed(1)}</span></div>`)
      .join("");
    const qaDetail = completedSession.answers
      .map((a, i) => {
        const ev = a.evaluation;
        const strengths = ev.strengths.length ? `<p class="pos">+ ${ev.strengths.join(" · ")}</p>` : "";
        const weaknesses = ev.weaknesses.length ? `<p class="neg">→ ${ev.weaknesses.join(" · ")}</p>` : "";
        return `<div class="qa"><p class="qt">Q${i + 1}: ${a.question}</p><p class="ans">${a.answer}</p><p class="sc">Score: ${ev.score.toFixed(1)}/10${ev.star_score != null ? ` · STAR: ${ev.star_score.toFixed(1)}/10` : ""}</p>${strengths}${weaknesses}</div>`;
      })
      .join("");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Interview Report</title><style>
      body{font-family:Arial,sans-serif;font-size:13px;margin:2cm;color:#111;}
      h1{font-size:1.5em;color:#0f172a;margin-bottom:.2em;}h2{font-size:1.1em;margin-top:1.4em;border-bottom:2px solid #e2e8f0;padding-bottom:.3em;color:#334155;}
      .score-big{font-size:2.2em;font-weight:700;color:#0f766e;}.readiness{display:inline-block;padding:2px 12px;border-radius:20px;background:#f0fdf4;color:#15803d;font-weight:600;margin-left:8px;}
      .bar-row{display:flex;align-items:center;margin:5px 0;}.lbl{width:145px;font-size:.88em;text-transform:capitalize;}.bar{height:9px;border-radius:4px;background:#0f766e;margin-right:8px;}.bv{font-weight:700;font-size:.88em;}
      ul{padding-left:1.2em;}li{margin:3px 0;}
      .qa{border-left:3px solid #e2e8f0;padding-left:12px;margin:12px 0;}.qt{font-weight:700;margin-bottom:3px;}.ans{color:#475569;margin-bottom:3px;}.sc{font-weight:600;color:#0f766e;font-size:.9em;}
      .pos{color:#15803d;font-size:.88em;}.neg{color:#b45309;font-size:.88em;}
      @media print{body{margin:1cm;}}
    </style></head><body>
      <h1>Interview Report</h1>
      <p style="color:#64748b">${completedSession.job_title} · ${completedSession.question_count} questions · ${date}</p>
      <p><span class="score-big">${completedSession.overall_score.toFixed(1)}</span><span style="font-size:.9em;color:#64748b">/10</span><span class="readiness">${r.readiness}</span></p>
      <h2>Summary</h2><p>${r.summary}</p>
      <h2>Score Breakdown</h2>${breakdownRows}
      <h2>Top Strengths</h2><ul>${(r.top_strengths ?? []).map((s: string) => `<li>${s}</li>`).join("")}</ul>
      <h2>Priority Improvements</h2><ul>${(r.priority_improvements ?? []).map((s: string) => `<li>${s}</li>`).join("")}</ul>
      <h2>Recommended Drills</h2><ul>${(r.recommended_drills ?? []).map((s: string) => `<li>${s}</li>`).join("")}</ul>
      <h2>Q&A Detail</h2>${qaDetail}
    </body></html>`);
    win.document.close();
    win.print();
  }

  function speakText(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = setup.language === "ar" ? "ar-SA" : "en-US";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  // Auto-speak new questions when TTS is enabled
  useEffect(() => {
    const q = questions[currentIndex];
    if (ttsEnabled && q && pageState === "interviewing" && !currentEvaluation) {
      speakText(q.question);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, ttsEnabled]);

  // D2: After evaluation lands, warm the connection by touching the session endpoint in background
  useEffect(() => {
    if (pageState === "interviewing" && currentEvaluation && sessionId) {
      fetch(`/api/interviews/sessions/${sessionId}`, { method: "HEAD" }).catch(() => {});
    }
  }, [pageState, currentEvaluation, sessionId]);

  function handleVideoRecorded(blob: Blob) {
    const url = URL.createObjectURL(blob);
    setVideoRecordings((prev) => ({ ...prev, [currentIndex]: url }));
  }

  // Countdown timer — resets when question changes or answering resumes
  const isAnsweringNow = pageState === "interviewing" && !currentEvaluation;
  useEffect(() => {
    if (setup.timerDuration === 0 || !isAnsweringNow) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(setup.timerDuration);
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isAnsweringNow ? 1 : 0, setup.timerDuration]);

  const currentQuestion = questions[currentIndex];
  const activeSessionCount = sessions.filter((session) => session.status === "active").length;
  const completedSessions = sessions.filter((session) => session.status === "completed");
  const latestCompletedScore = completedSessions[0]?.overall_score ?? null;
  const readinessLabel =
    latestCompletedScore == null ? t("readiness.notScored")
    : latestCompletedScore >= 8 ? t("readiness.strong")
    : latestCompletedScore >= 6 ? t("readiness.improving")
    : t("readiness.needsPractice");
  const experienceLevels = EXPERIENCE_LEVEL_VALUES.map((value) => ({ value, label: t(`levels.${value}`) }));
  const interviewTypes = INTERVIEW_TYPE_VALUES.map((value) => ({ value, label: t(`types.${value}`) }));
  const interviewerStyles = INTERVIEWER_STYLE_VALUES.map((value) => ({
    value,
    label: t(`styles.${value}`),
    desc: t(`styles.${value}Desc`),
  }));

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-gradient-to-br from-brand-800/8 via-white to-teal/5 px-6 py-6 md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{t("title")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{t("description")}</p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("readiness.label")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{readinessLabel}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {latestCompletedScore == null ? t("readiness.firstSession") : t("readiness.latestScore", { score: latestCompletedScore.toFixed(1) })}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("resumeContext.label")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{resumes.length > 0 ? t("resumeContext.available") : t("resumeContext.optional")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {resumes.length > 0
                    ? (resumes.length === 1 ? t("resumeContext.hasResumes_one", { count: 1 }) : t("resumeContext.hasResumes_other", { count: resumes.length }))
                    : t("resumeContext.noResumes")}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("openSessions.label")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{activeSessionCount}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t("openSessions.hint")}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-brand-900 px-6 py-6 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("bestPractice.label")}</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("bestPractice.step1Title")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t("bestPractice.step1Desc")}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("bestPractice.step2Title")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t("bestPractice.step2Desc")}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("bestPractice.step3Title")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t("bestPractice.step3Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {pageState === "setup" && sessions.some((s) => s.status === "active") && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-sm font-semibold text-amber-800">{t("unfinishedSession")}</p>
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

      {pageState === "setup" && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-800/5 to-brand-800/10 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-600">{t("weeklyChallenge.eyebrow")}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{t("weeklyChallenge.title", { role: weeklyChallenge.jobTitle })}</p>
              <p className="mt-0.5 text-xs text-slate-500">{t("weeklyChallenge.focus", { focus: weeklyChallenge.focus })}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">{weeklyChallenge.level}</span>
              <span className="inline-flex rounded-full border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">{weeklyChallenge.type}</span>
              <button
                type="button"
                onClick={() => {
                  setSetup((prev) => ({ ...prev, jobTitle: weeklyChallenge.jobTitle, type: weeklyChallenge.type, level: weeklyChallenge.level, count: 5 }));
                  void handleStart();
                }}
                className="rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                {t("weeklyChallenge.start")}
              </button>
            </div>
          </div>
        </div>
      )}

      {(pageState === "setup" || pageState === "generating") && (
        <Panel className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("configure")}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{t("setupSimulation")}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <input value={setup.jobTitle} onChange={(e) => setSetup((p) => ({ ...p, jobTitle: e.target.value }))} placeholder={t("form.jobTitlePlaceholder")} className="md:col-span-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
            <select value={setup.resumeId} onChange={(e) => setSetup((p) => ({ ...p, resumeId: e.target.value }))} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm">
              <option value="">{t("form.noResumeContext")}</option>
              {resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.source_filename ?? resume.title}</option>)}
            </select>
            <input value={setup.companyName} onChange={(e) => setSetup((p) => ({ ...p, companyName: e.target.value }))} placeholder={t("form.companyNamePlaceholder")} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm" />
            <div className="space-y-2">{experienceLevels.map((item) => <label key={item.value} className="flex items-center gap-2 text-sm"><input type="radio" checked={setup.level === item.value} onChange={() => setSetup((p) => ({ ...p, level: item.value }))} />{item.label}</label>)}</div>
            <div className="space-y-2">{interviewTypes.map((item) => <label key={item.value} className="flex items-center gap-2 text-sm"><input type="radio" checked={setup.type === item.value} onChange={() => setSetup((p) => ({ ...p, type: item.value }))} />{item.label}</label>)}</div>
            <div className="flex gap-3">{(["en", "ar"] as const).map((language) => <label key={language} className="flex items-center gap-2 text-sm"><input type="radio" checked={setup.language === language} onChange={() => setSetup((p) => ({ ...p, language }))} />{language === "en" ? t("form.english") : t("form.arabic")}</label>)}</div>
            <div className="flex gap-3">{QUESTION_COUNTS.map((count) => <button key={count} type="button" onClick={() => setSetup((p) => ({ ...p, count }))} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${setup.count === count ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 bg-white text-slate-700"}`}>{count}</button>)}</div>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-600">{t("timer.label")}</p>
              <div className="flex gap-2">
                {([0, 60, 120, 180] as TimerDuration[]).map((d) => (
                  <button key={d} type="button" onClick={() => setSetup((p) => ({ ...p, timerDuration: d }))} className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${setup.timerDuration === d ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 bg-white text-slate-700"}`}>
                    {d === 0 ? t("timer.none") : t(`timer.${d}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 grid gap-3 md:grid-cols-3">
              {interviewerStyles.map((style) => <button key={style.value} type="button" onClick={() => setSetup((p) => ({ ...p, interviewerStyle: style.value }))} className={`rounded-2xl border p-4 text-left ${setup.interviewerStyle === style.value ? "border-brand-800 bg-brand-800 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}><p className="text-sm font-semibold">{style.label}</p><p className={`mt-2 text-xs ${setup.interviewerStyle === style.value ? "text-slate-200" : "text-slate-500"}`}>{style.desc}</p></button>)}
            </div>
            {jobDescriptions.length > 0 && (
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">{t("form.loadFromJobLabel")}</label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const jd = jobDescriptions.find((j) => j.id === e.target.value);
                    if (jd) setSetup((p) => ({ ...p, jobTitle: p.jobTitle || jd.title, jobDescription: jd.normalized_text ?? p.jobDescription }));
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm"
                >
                  <option value="">{t("form.loadFromJobDefault")}</option>
                  {jobDescriptions.map((jd) => (
                    <option key={jd.id} value={jd.id}>{jd.title}{jd.company_name ? ` — ${jd.company_name}` : ""}</option>
                  ))}
                </select>
              </div>
            )}
            <textarea value={setup.jobDescription} onChange={(e) => setSetup((p) => ({ ...p, jobDescription: e.target.value }))} rows={6} placeholder={t("form.jdPlaceholder")} className="md:col-span-2 rounded-xl border border-slate-300 px-4 py-3 text-sm" />
          </div>
          {pageError && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</div>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" disabled={!setup.jobTitle.trim() || pageState === "generating"} onClick={() => void handleStart()} className="rounded-xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{pageState === "generating" ? t("form.preparingInterviewer") : t("form.startInterview")}</button>
            <button type="button" disabled={pageState === "generating"} onClick={handleQuickPractice} className="rounded-xl border border-brand-800 bg-white px-5 py-3 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-50">
              {t("session.quickPractice")} <span className="ml-1 text-xs font-normal text-slate-400">{t("session.quickPracticeDesc")}</span>
            </button>
          </div>
        </Panel>
      )}

      {pageState === "brief" && (
        <Panel className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("brief.eyebrow")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{setup.jobTitle}</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("brief.format")}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{t(`types.${setup.type}`)}</p>
              <p className="mt-1 text-xs text-slate-500">{t("brief.questionsCount", { count: setup.count })}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("brief.duration")}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{t("brief.estimatedDuration", { minutes: setup.count * 3 })}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${styleClass(setup.interviewerStyle)}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">{t("brief.style")}</p>
              <p className="mt-2 text-sm font-semibold">{t(`styles.${setup.interviewerStyle}`)}</p>
            </div>
          </div>

          {contextSummary?.focus_areas && contextSummary.focus_areas.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("brief.focusAreas")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {contextSummary.focus_areas.map((area) => (
                  <span key={area} className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{area}</span>
                ))}
              </div>
            </div>
          )}

          {openingMessage && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{openingMessage}</div>
          )}

          <button type="button" onClick={() => setPageState("interviewing")} className="mt-6 rounded-xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white">
            {t("brief.beginInterview")}
          </button>
        </Panel>
      )}

      {(pageState === "interviewing" || pageState === "evaluating" || pageState === "completing") && currentQuestion && (
        <Panel className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{setup.jobTitle}</p>
              <p className="text-xs text-slate-400">{t("session.questionOf", { n: currentIndex + 1, total: questionCount })}</p>
            </div>
            <div className="flex items-center gap-2">
              {timeLeft !== null && (
                <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums ${timeLeft === 0 ? "border-rose-300 bg-rose-50 text-rose-700 animate-pulse" : timeLeft <= 30 ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                  {timeLeft === 0 ? t("session.timerExpired") : `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
                </span>
              )}
              <button type="button" onClick={() => { setTtsEnabled((v) => !v); if (!ttsEnabled && currentQuestion) speakText(currentQuestion.question); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:border-slate-300">
                {ttsEnabled ? t("session.ttsOn") : t("session.ttsOff")}
              </button>
              <button type="button" onClick={handleRetry} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500">{t("session.endSession")}</button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {Array.from({ length: questionCount }).map((_, i) => {
              const score = answerScores[i];
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              const circleClass = isDone
                ? score !== undefined && score >= 7.5
                  ? "bg-teal text-white"
                  : score !== undefined && score >= 5
                    ? "bg-amber-400 text-white"
                    : "bg-rose-400 text-white"
                : isCurrent
                  ? "bg-brand-700 text-white ring-2 ring-brand-200"
                  : "border border-slate-200 bg-slate-100 text-slate-400";
              return (
                <div
                  key={i}
                  title={isDone && score !== undefined ? `Q${i + 1}: ${score.toFixed(1)}/10` : `Question ${i + 1}`}
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all ${circleClass}`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
              );
            })}
            <span className="ml-auto text-xs text-slate-400">{currentIndex}/{questionCount}</span>
          </div>
          <div className="mt-4 space-y-3">
            {openingMessage && currentIndex === 0 && <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{openingMessage}</div>}
            <ContextChips context={contextSummary} />
            {contextSummary?.target_role_summary && <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{contextSummary.target_role_summary}</div>}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeClass(currentQuestion.type)}`}>{currentQuestion.type === "technical" ? t("session.technical") : t("session.behavioral")}</span>
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">{currentQuestion.source === "follow_up" ? t("session.followUp") : currentQuestion.source === "planned" ? t("session.planned") : t("session.opening")}</span>
              {currentQuestion.focus_area && <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">{currentQuestion.focus_area}</span>}
            </div>
            <div className="flex items-start gap-2">
              <p className="flex-1 text-base font-semibold leading-snug text-slate-900">{currentQuestion.question}</p>
              <button
                type="button"
                title={isQuestionSaved(currentQuestion) ? t("session.questionSaved") : t("session.saveQuestion")}
                onClick={() => toggleSaveQuestion(currentQuestion)}
                className={`mt-0.5 shrink-0 rounded-lg border px-2 py-1 text-xs transition-colors ${isQuestionSaved(currentQuestion) ? "border-teal-light bg-teal-light/20 text-teal" : "border-slate-200 bg-white text-slate-400 hover:border-teal-light hover:text-teal"}`}
              >
                {isQuestionSaved(currentQuestion) ? "🔖" : "☆"}
              </button>
            </div>
          </div>
          {!currentEvaluation ? (
            <>
              <InterviewAnswerComposer
                answerMode={answerMode}
                onAnswerModeChange={setAnswerMode}
                answerValue={currentAnswer}
                onAnswerChange={setCurrentAnswer}
                language={setup.language}
                questionKey={`${sessionId ?? "session"}:${currentIndex}:${currentQuestion.index}`}
                isSubmitting={pageState === "evaluating"}
                error={answerError}
                onVideoRecorded={handleVideoRecorded}
                onSubmit={() => {
                  if (!showAnswerPreview && currentAnswer.trim().length > 0) {
                    setShowAnswerPreview(true);
                  } else {
                    setShowAnswerPreview(false);
                    void handleSubmitAnswer();
                  }
                }}
              />
              {showAnswerPreview && pageState !== "evaluating" && (
                <div className="mt-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-600">{t("session.previewAnswer")}</p>
                  <p className="text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">{currentAnswer}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowAnswerPreview(false); void handleSubmitAnswer(); }} className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white">{t("session.confirmSubmit")}</button>
                    <button type="button" onClick={() => setShowAnswerPreview(false)} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">{t("session.editAnswer")}</button>
                  </div>
                </div>
              )}
              {pageState === "evaluating" && (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  {streamingReply ? (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t("evaluation.interviewerTyping")}</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {streamingReply}
                        <span className="animate-pulse text-slate-400">▌</span>
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex gap-1">
                        {[0, 150, 300].map((delay) => (
                          <span key={delay} className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                        ))}
                      </span>
                      <span className="text-sm text-slate-500">{t("evaluation.evaluatingAnswer")}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="mt-5 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t("evaluation.interviewerReply")}</p><p className="mt-2">{currentEvaluation.interviewer_reply}</p></div>
              <div className="flex gap-3">
                <div className={`flex-1 rounded-xl border px-4 py-3 ${currentEvaluation.score >= 7.5 ? "border-teal-light bg-teal-light/20" : currentEvaluation.score >= 5 ? "border-amber-200 bg-amber-50" : "border-rose-200 bg-rose-50"}`}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t("evaluation.answerScore")}</p>
                  <p className="mt-2 text-2xl font-bold">{currentEvaluation.score.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></p>
                </div>
                {currentEvaluation.star_score != null && (
                  <div className="min-w-[90px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{t("evaluation.starScore")}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-700">{currentEvaluation.star_score.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></p>
                  </div>
                )}
                {currentEvaluation.weakness_type && currentEvaluation.weakness_type !== "strong" && (
                  <div className={`flex items-center rounded-xl border px-4 py-3 ${WEAKNESS_TYPE_CLASS[currentEvaluation.weakness_type] ?? "border-slate-200 bg-slate-50 text-slate-600"}`}>
                    <p className="text-xs font-semibold">{t(`weaknessType.${currentEvaluation.weakness_type}`)}</p>
                  </div>
                )}
              </div>
              {currentEvaluation.communication_tip && <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"><p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{t("evaluation.coachingTip")}</p><p className="mt-2">{currentEvaluation.communication_tip}</p></div>}
              {currentEvaluation.strengths.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal">{t("evaluation.strengths")}</p><ul className="space-y-1.5 text-sm text-slate-700">{currentEvaluation.strengths.map((item) => <li key={item}>+ {item}</li>)}</ul></div>}
              {currentEvaluation.weaknesses.length > 0 && <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-700">{t("evaluation.improvements")}</p><ul className="space-y-1.5 text-sm text-slate-700">{currentEvaluation.weaknesses.map((item) => <li key={item}>-&gt; {item}</li>)}</ul></div>}
              {currentEvaluation.improved_answer && <div><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">{t("evaluation.suggestedAnswer")}</p><div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">{currentEvaluation.improved_answer}</div></div>}
              {nextQuestion && <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"><p className="text-[10px] font-semibold uppercase tracking-widest text-brand-500">{t("evaluation.nextQuestion")}</p><p className="mt-2">{nextQuestion.question}</p></div>}
              <button type="button" disabled={pageState === "completing"} onClick={() => void handleNext()} className="rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{pageState === "completing" ? t("evaluation.generatingReport") : currentIndex + 1 >= questionCount ? t("evaluation.viewFinalReport") : t("evaluation.nextQuestionBtn")}</button>
            </div>
          )}
        </Panel>
      )}

      {pageState === "completed" && completedSession && (
        <div className="space-y-5">
          <Panel className="p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("finalReport.eyebrow")}</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{completedSession.job_title}</h2>
                <p className="mt-2 text-xs text-slate-500">{t("finalReport.questions", { count: completedSession.question_count })} - {formatDate(completedSession.created_at)}</p>
              </div>
              <div className="text-right text-2xl font-bold text-slate-900">{completedSession.overall_score.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span></div>
            </div>
            {completedSession.context_summary && <div className="mt-4"><ContextChips context={completedSession.context_summary} /></div>}
            {completedSession.final_report?.summary && <p className="mt-4 text-sm leading-7 text-slate-600">{completedSession.final_report.summary}</p>}
            {completedSession.final_report?.breakdown && <div className="mt-5 space-y-2.5"><ScoreBar label={t("finalReport.breakdown.relevance")} score={completedSession.final_report.breakdown.relevance} /><ScoreBar label={t("finalReport.breakdown.clarity")} score={completedSession.final_report.breakdown.clarity} /><ScoreBar label={t("finalReport.breakdown.professionalism")} score={completedSession.final_report.breakdown.professionalism} /><ScoreBar label={t("finalReport.breakdown.confidence")} score={completedSession.final_report.breakdown.confidence} /><ScoreBar label={t("finalReport.breakdown.roleFit")} score={completedSession.final_report.breakdown.role_fit} /></div>}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-teal-light bg-teal-light/20 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-teal">{t("finalReport.topStrengths")}</p><ul className="mt-3 space-y-2 text-sm text-teal">{(completedSession.final_report?.top_strengths ?? []).map((item: string) => <li key={item}>+ {item}</li>)}</ul></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-amber-700">{t("finalReport.priorityImprovements")}</p><ul className="mt-3 space-y-2 text-sm text-amber-900">{(completedSession.final_report?.priority_improvements ?? []).map((item: string) => <li key={item}>-&gt; {item}</li>)}</ul></div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4"><p className="text-xs font-semibold uppercase tracking-widest text-sky-700">{t("finalReport.recommendedDrills")}</p><ul className="mt-3 space-y-2 text-sm text-sky-900">{(completedSession.final_report?.recommended_drills ?? []).map((item: string) => <li key={item}>• {item}</li>)}</ul></div>
            </div>
            {Object.keys(videoRecordings).length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("finalReport.yourRecordings")}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {Object.entries(videoRecordings).map(([idx, url]) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-[11px] font-semibold text-slate-500">Q{Number(idx) + 1}</p>
                      <video controls src={url} className="w-full rounded-xl border border-slate-200 bg-black" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={handleRetry} className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700">{t("finalReport.practiceAgain")}</button>
              <button type="button" onClick={exportReportPdf} className="rounded-xl border border-brand-800 bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">{t("finalReport.exportPdf")}</button>
            </div>

            {completedSessions.length > 1 && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t("finalReport.progressTrend")}</p>
                <div className="mt-4 flex items-end gap-4">
                  {completedSessions.slice(0, 4).filter((s) => s.overall_score != null).reverse().map((s, i, arr) => {
                    const sc = s.overall_score!;
                    return (
                      <div key={s.id} className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-semibold text-slate-600">{sc.toFixed(1)}</span>
                        <div
                          className={`w-10 rounded-t-md transition-all ${sc >= 7.5 ? "bg-teal" : sc >= 5 ? "bg-amber-400" : "bg-rose-400"}`}
                          style={{ height: `${Math.max(12, Math.round((sc / 10) * 64))}px` }}
                        />
                        <span className="text-[9px] text-slate-400">
                          {i === arr.length - 1 ? t("finalReport.progressTrendLatest") : t("finalReport.progressTrendPrevious", { n: arr.length - 1 - i })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>
        </div>
      )}

      {(pageState === "setup" || pageState === "completed") && (
        <Panel className="overflow-hidden">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("history.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {sessions.length === 1 ? t("history.title_one") : t("history.title_other", { count: sessions.length })}
            </h2>
          </div>
          {sessions.length === 0 ? (
            <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">{t("history.empty")}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-y border-slate-100 bg-slate-50"><th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("history.table.role")}</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("history.table.type")}</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("history.table.score")}</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("history.table.date")}</th><th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("history.table.actions")}</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((session) => (
                    <tr key={session.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="px-6 py-4"><p className="font-medium text-slate-900">{session.job_title}</p><p className="mt-0.5 text-xs text-slate-400">{session.question_count}Q</p></td>
                      <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeClass(session.interview_type)}`}>{session.interview_type}</span></td>
                      <td className="px-4 py-4">{session.overall_score != null ? <span className="text-sm font-semibold text-slate-700">{session.overall_score.toFixed(1)}/10</span> : <span className="text-xs text-slate-400">-</span>}</td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(session.created_at)}</td>
                      <td className="px-6 py-4 text-right"><button type="button" disabled={session.status !== "completed" || historyLoading} onClick={() => void handleViewHistory(session.id)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">{t("history.review")}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {(pageState === "setup" || pageState === "completed") && (
        <Panel className="overflow-hidden">
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("questionBank.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {savedQuestions.length === 1 ? t("questionBank.title_one") : t("questionBank.title_other", { count: savedQuestions.length })}
            </h2>
          </div>
          {savedQuestions.length === 0 ? (
            <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">{t("questionBank.empty")}</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {savedQuestions.map((sq) => (
                <div key={sq.id} className="flex items-start gap-3 px-6 py-4">
                  <span className={`mt-0.5 shrink-0 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeClass(sq.type)}`}>{sq.type === "technical" ? t("session.technical") : t("session.behavioral")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-800">{sq.question}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{t("questionBank.jobLabel", { title: sq.job_title })} · {formatDate(sq.saved_at)}</p>
                  </div>
                  <button type="button" onClick={() => removeSavedQuestion(sq.id)} className="shrink-0 rounded-lg border border-rose-200 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50">{t("questionBank.remove")}</button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
