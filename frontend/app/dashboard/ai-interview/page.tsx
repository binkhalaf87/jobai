"use client";

import { useCallback, useEffect, useState } from "react";

import { Panel } from "@/components/panel";
import { ApiError } from "@/lib/api";
import {
  completeInterview,
  getInterview,
  listInterviews,
  startInterview,
  submitAnswer,
} from "@/lib/interviews";
import type {
  AnswerEvaluation,
  ExperienceLevel,
  InterviewAnswer,
  InterviewCompleteResponse,
  InterviewFinalReport,
  InterviewListItem,
  InterviewQuestion,
  InterviewType,
  QuestionCount,
} from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: "entry", label: "Entry Level (0–2 yrs)" },
  { value: "mid",   label: "Mid Level (3–5 yrs)" },
  { value: "senior", label: "Senior Level (6+ yrs)" },
];

const INTERVIEW_TYPES: { value: InterviewType; label: string; desc: string }[] = [
  { value: "hr",        label: "HR Interview",        desc: "Behavioral & situational" },
  { value: "technical", label: "Technical Interview",  desc: "Role-specific skills" },
  { value: "mixed",     label: "Mixed Interview",      desc: "HR + Technical" },
];

const QUESTION_COUNTS: QuestionCount[] = [3, 5, 10];

const READINESS_CONFIG = {
  "Interview Ready":    { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  "Good Progress":      { color: "text-amber-700",   bg: "bg-amber-50 border-amber-200" },
  "Needs Improvement":  { color: "text-rose-700",    bg: "bg-rose-50 border-rose-200" },
} as const;

const TYPE_BADGE: Record<string, string> = {
  hr:        "bg-blue-50 text-blue-700 border-blue-200",
  technical: "bg-purple-50 text-purple-700 border-purple-200",
  mixed:     "bg-teal-50 text-teal-700 border-teal-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function ScoreDot({ score }: { score: number }) {
  const pct = Math.round((score / 10) * 100);
  const color =
    score >= 7.5 ? "text-emerald-600" :
    score >= 5   ? "text-amber-600"   :
                   "text-rose-600";
  return (
    <span className={`text-2xl font-bold tabular-nums ${color}`}>
      {score.toFixed(1)}<span className="text-sm font-normal text-slate-400">/10</span>
      <span className="ml-2 text-xs font-normal text-slate-400">({pct}%)</span>
    </span>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = Math.round((score / 10) * 100);
  const barColor =
    score >= 7.5 ? "bg-emerald-500" :
    score >= 5   ? "bg-amber-400"   :
                   "bg-rose-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-xs text-slate-600">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold tabular-nums text-slate-700">{score.toFixed(1)}</span>
    </div>
  );
}

// ─── Page state machine ───────────────────────────────────────────────────────

type PageState =
  | "setup"        // Initial config form
  | "generating"   // Awaiting question generation
  | "interviewing" // Active Q&A session
  | "evaluating"   // Awaiting answer evaluation
  | "completing"   // Awaiting final report generation
  | "completed"    // Show final report
  | "history";     // Viewing a past session

// ─── Setup form ──────────────────────────────────────────────────────────────

type SetupValues = {
  jobTitle: string;
  level: ExperienceLevel;
  type: InterviewType;
  language: "en" | "ar";
  count: QuestionCount;
};

function SetupCard({
  values,
  onChange,
  onStart,
  loading,
  error,
}: {
  values: SetupValues;
  onChange: (v: Partial<SetupValues>) => void;
  onStart: () => void;
  loading: boolean;
  error: string;
}) {
  const canStart = values.jobTitle.trim().length > 0 && !loading;

  return (
    <Panel className="p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Configure</p>
      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Set up your mock interview</h2>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* Job Title */}
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="job-title">
            Job Title <span className="text-rose-500">*</span>
          </label>
          <input
            id="job-title"
            type="text"
            value={values.jobTitle}
            onChange={(e) => onChange({ jobTitle: e.target.value })}
            placeholder="e.g. Senior Software Engineer, Product Manager, Data Analyst…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

        {/* Experience Level */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience Level</label>
          <div className="flex flex-col gap-2">
            {EXPERIENCE_LEVELS.map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="level"
                  value={opt.value}
                  checked={values.level === opt.value}
                  onChange={() => onChange({ level: opt.value })}
                  className="h-4 w-4 accent-slate-900"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Interview Type */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Interview Type</label>
          <div className="flex flex-col gap-2">
            {INTERVIEW_TYPES.map((opt) => (
              <label key={opt.value} className="flex cursor-pointer items-center gap-3">
                <input
                  type="radio"
                  name="itype"
                  value={opt.value}
                  checked={values.type === opt.value}
                  onChange={() => onChange({ type: opt.value })}
                  className="h-4 w-4 accent-slate-900"
                />
                <span className="text-sm text-slate-700">
                  {opt.label}{" "}
                  <span className="text-slate-400">— {opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Language</label>
          <div className="flex gap-4">
            {(["en", "ar"] as const).map((lang) => (
              <label key={lang} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="lang"
                  value={lang}
                  checked={values.language === lang}
                  onChange={() => onChange({ language: lang })}
                  className="h-4 w-4 accent-slate-900"
                />
                <span className="text-sm text-slate-700">{lang === "en" ? "English" : "Arabic"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Number of Questions */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Number of Questions</label>
          <div className="flex gap-3">
            {QUESTION_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ count: n })}
                className={`rounded-xl border px-5 py-2 text-sm font-semibold transition ${
                  values.count === n
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          disabled={!canStart}
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating questions…
            </>
          ) : (
            "Start Interview"
          )}
        </button>
      </div>
    </Panel>
  );
}

// ─── Question progress bar ────────────────────────────────────────────────────

function QuestionProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full transition-all ${
              i < current ? "bg-slate-900" : i === current ? "bg-slate-400" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-slate-500">
        Question {current + 1} of {total}
      </span>
    </div>
  );
}

// ─── Evaluation block ─────────────────────────────────────────────────────────

function EvaluationBlock({
  evaluation,
  question,
  onNext,
  isLast,
  completing,
}: {
  evaluation: AnswerEvaluation;
  question: string;
  onNext: () => void;
  isLast: boolean;
  completing: boolean;
}) {
  const score = evaluation.score;
  const scoreColor =
    score >= 7.5 ? "border-emerald-200 bg-emerald-50" :
    score >= 5   ? "border-amber-200 bg-amber-50" :
                   "border-rose-200 bg-rose-50";

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5">
      {/* Score header */}
      <div className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${scoreColor}`}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Your Score</p>
          <ScoreDot score={score} />
        </div>
      </div>

      {/* Strengths */}
      {evaluation.strengths.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-700">Strengths</p>
          <ul className="space-y-1.5">
            {evaluation.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-emerald-500">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {evaluation.weaknesses.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-700">Areas to Improve</p>
          <ul className="space-y-1.5">
            {evaluation.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-0.5 text-amber-500">→</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improved answer */}
      {evaluation.improved_answer && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Suggested Answer
          </p>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">
            {evaluation.improved_answer}
          </div>
        </div>
      )}

      {/* Next button */}
      <div className="pt-1">
        <button
          type="button"
          disabled={completing}
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {completing ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating report…
            </>
          ) : isLast ? (
            "View Final Report"
          ) : (
            "Next Question →"
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Interview session card ───────────────────────────────────────────────────

function InterviewSessionCard({
  questions,
  currentIndex,
  pageState,
  currentAnswer,
  currentEvaluation,
  onAnswerChange,
  onSubmit,
  onNext,
  error,
}: {
  questions: InterviewQuestion[];
  currentIndex: number;
  pageState: PageState;
  currentAnswer: string;
  currentEvaluation: AnswerEvaluation | null;
  onAnswerChange: (v: string) => void;
  onSubmit: () => void;
  onNext: () => void;
  error: string;
}) {
  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const isEvaluating = pageState === "evaluating";
  const hasEval = currentEvaluation !== null;
  const isCompleting = pageState === "completing";

  if (!currentQ) return null;

  return (
    <Panel className="p-6 md:p-8">
      <QuestionProgress current={currentIndex} total={questions.length} />

      <div className="mt-5">
        <div className="mb-1 flex items-center gap-2">
          <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_BADGE[currentQ.type] ?? TYPE_BADGE.hr}`}>
            {currentQ.type === "hr" ? "Behavioral" : "Technical"}
          </span>
        </div>
        <p className="text-base font-semibold leading-snug text-slate-900">{currentQ.question}</p>
      </div>

      {!hasEval && (
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="answer-input">
              Your Answer
            </label>
            <textarea
              id="answer-input"
              rows={6}
              value={currentAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              disabled={isEvaluating}
              placeholder="Type your answer here… Be specific. Use the STAR method where applicable."
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!currentAnswer.trim() || isEvaluating}
            onClick={onSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Evaluating…
              </>
            ) : (
              "Submit Answer"
            )}
          </button>
        </div>
      )}

      {hasEval && currentEvaluation && (
        <EvaluationBlock
          evaluation={currentEvaluation}
          question={currentQ.question}
          onNext={onNext}
          isLast={isLast}
          completing={isCompleting}
        />
      )}
    </Panel>
  );
}

// ─── Final report ─────────────────────────────────────────────────────────────

function FinalReportCard({
  session,
  onRetry,
}: {
  session: InterviewCompleteResponse;
  onRetry: () => void;
}) {
  const [showImproved, setShowImproved] = useState(false);
  const report = session.final_report;
  const readiness = report?.readiness ?? "Good Progress";
  const rdConfig = READINESS_CONFIG[readiness as keyof typeof READINESS_CONFIG] ?? READINESS_CONFIG["Good Progress"];

  const levelLabel = {
    entry: "Entry Level", mid: "Mid Level", senior: "Senior Level",
  }[session.experience_level] ?? session.experience_level;

  const typeLabel = {
    hr: "HR Interview", technical: "Technical Interview", mixed: "Mixed Interview",
  }[session.interview_type] ?? session.interview_type;

  return (
    <div className="space-y-5">
      {/* Header card */}
      <Panel className="p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Final Report</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{session.job_title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{levelLabel}</span>
              <span>·</span>
              <span>{typeLabel}</span>
              <span>·</span>
              <span>{session.question_count} questions</span>
              <span>·</span>
              <span>{formatDate(session.created_at)}</span>
            </div>
          </div>
          <div className="text-right">
            <ScoreDot score={session.overall_score} />
          </div>
        </div>

        {/* Readiness badge */}
        <div className={`mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold ${rdConfig.bg} ${rdConfig.color}`}>
          {readiness}
        </div>

        {/* Summary */}
        {report?.summary && (
          <p className="mt-4 text-sm leading-7 text-slate-600">{report.summary}</p>
        )}

        {/* Breakdown bars */}
        {report?.breakdown && (
          <div className="mt-5 space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Score Breakdown</p>
            <ScoreBar score={report.breakdown.relevance}      label="Relevance" />
            <ScoreBar score={report.breakdown.clarity}        label="Clarity" />
            <ScoreBar score={report.breakdown.professionalism} label="Professionalism" />
            <ScoreBar score={report.breakdown.confidence}     label="Confidence" />
            <ScoreBar score={report.breakdown.role_fit}       label="Role Fit" />
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
          >
            Practice Again
          </button>
          <button
            type="button"
            onClick={() => setShowImproved((p) => !p)}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            {showImproved ? "Hide Improvements" : "Improve My Answers"}
          </button>
        </div>
      </Panel>

      {/* Q&A breakdown */}
      <Panel className="overflow-hidden">
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Question-by-Question Breakdown
          </p>
        </div>
        <div className="divide-y divide-slate-100">
          {session.answers.map((item, i) => {
            const eval_ = item.evaluation;
            const score = eval_?.score ?? 0;
            const dotColor =
              score >= 7.5 ? "bg-emerald-500" :
              score >= 5   ? "bg-amber-400"   :
                             "bg-rose-400";
            return (
              <div key={i} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-slate-900">
                    <span className="mr-2 font-semibold text-slate-400">Q{item.index + 1}.</span>
                    {item.question}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                    <span className="text-sm font-semibold tabular-nums text-slate-700">{score.toFixed(1)}</span>
                  </div>
                </div>

                {/* User's answer */}
                <div className="mt-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Your Answer</p>
                  <p className="text-sm leading-relaxed text-slate-600">{item.answer}</p>
                </div>

                {/* Feedback pills */}
                {eval_ && (eval_.strengths.length > 0 || eval_.weaknesses.length > 0) && (
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {eval_.strengths.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-600">Strengths</p>
                        <ul className="space-y-1">
                          {eval_.strengths.map((s, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                              <span className="mt-0.5 text-emerald-500">✓</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {eval_.weaknesses.length > 0 && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-amber-600">To Improve</p>
                        <ul className="space-y-1">
                          {eval_.weaknesses.map((w, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                              <span className="mt-0.5 text-amber-500">→</span>{w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Improved answer (toggled) */}
                {showImproved && eval_?.improved_answer && (
                  <div className="mt-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Suggested Answer
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                      {eval_.improved_answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ─── History table ────────────────────────────────────────────────────────────

function HistoryPanel({
  sessions,
  onView,
  loading,
}: {
  sessions: InterviewListItem[];
  onView: (id: string) => void;
  loading: boolean;
}) {
  const levelShort = { entry: "Entry", mid: "Mid", senior: "Senior" };
  const typeShort   = { hr: "HR", technical: "Technical", mixed: "Mixed" };

  return (
    <Panel className="overflow-hidden">
      <div className="px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Past Sessions</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {sessions.length} saved session{sessions.length !== 1 ? "s" : ""}
        </h2>
      </div>

      {sessions.length === 0 ? (
        <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <p className="text-sm text-slate-500">No sessions yet. Complete your first interview above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Date</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{s.job_title}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{levelShort[s.experience_level]} · {s.question_count}Q</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TYPE_BADGE[s.interview_type] ?? ""}`}>
                      {typeShort[s.interview_type]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {s.overall_score != null ? (
                      <span className="text-sm font-semibold tabular-nums text-slate-700">{s.overall_score.toFixed(1)}/10</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{formatDate(s.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      disabled={s.status !== "completed" || loading}
                      onClick={() => onView(s.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DashboardAiInterviewPage() {
  // ── Setup form state ──────────────────────────────────────────────────────
  const [setup, setSetup] = useState<SetupValues>({
    jobTitle: "",
    level: "mid",
    type: "mixed",
    language: "en",
    count: 5,
  });

  // ── Page-level state machine ──────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>("setup");
  const [pageError, setPageError] = useState("");

  // ── Active session data ───────────────────────────────────────────────────
  const [sessionId, setSessionId]             = useState<string | null>(null);
  const [questions, setQuestions]             = useState<InterviewQuestion[]>([]);
  const [currentIndex, setCurrentIndex]       = useState(0);
  const [currentAnswer, setCurrentAnswer]     = useState("");
  const [answerError, setAnswerError]         = useState("");
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);
  const [collectedAnswers, setCollectedAnswers] = useState<InterviewAnswer[]>([]);

  // ── Completed session ─────────────────────────────────────────────────────
  const [completedSession, setCompletedSession] = useState<InterviewCompleteResponse | null>(null);

  // ── History ───────────────────────────────────────────────────────────────
  const [sessions, setSessions]               = useState<InterviewListItem[]>([]);
  const [historyLoading, setHistoryLoading]   = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const list = await listInterviews();
      setSessions(list);
    } catch {
      // fail silently — history is supplementary
    }
  }, []);

  useEffect(() => { void loadHistory(); }, [loadHistory]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleStart() {
    setPageError("");
    setPageState("generating");
    try {
      const session = await startInterview({
        job_title:        setup.jobTitle.trim(),
        experience_level: setup.level,
        interview_type:   setup.type,
        language:         setup.language,
        question_count:   setup.count,
      });
      setSessionId(session.id);
      setQuestions(session.questions);
      setCurrentIndex(0);
      setCurrentAnswer("");
      setCurrentEvaluation(null);
      setCollectedAnswers([]);
      setPageState("interviewing");
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Failed to generate questions. Please try again.";
      setPageError(msg);
      setPageState("setup");
    }
  }

  async function handleSubmitAnswer() {
    if (!sessionId || !currentAnswer.trim()) return;
    setAnswerError("");
    setPageState("evaluating");

    const q = questions[currentIndex];
    try {
      const result = await submitAnswer(sessionId, currentIndex, q.question, currentAnswer.trim());
      setCurrentEvaluation(result.evaluation);
      setCollectedAnswers((prev) => {
        const without = prev.filter((a) => a.index !== currentIndex);
        return [
          ...without,
          {
            index: currentIndex,
            question: q.question,
            answer: currentAnswer.trim(),
            evaluation: result.evaluation,
          },
        ];
      });
      setPageState("interviewing"); // evaluation shown via currentEvaluation
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Evaluation failed. Please try again.";
      setAnswerError(msg);
      setPageState("interviewing");
    }
  }

  async function handleNext() {
    const isLast = currentIndex === questions.length - 1;

    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      setCurrentAnswer("");
      setCurrentEvaluation(null);
      setAnswerError("");
      return;
    }

    // Last question answered — generate final report
    if (!sessionId) return;
    setPageState("completing");
    try {
      const result = await completeInterview(sessionId);
      setCompletedSession(result);
      setPageState("completed");
      void loadHistory();
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Failed to generate final report. Please try again.";
      setPageError(msg);
      setPageState("interviewing"); // stay on last question
    }
  }

  function handleRetry() {
    setPageState("setup");
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setCurrentAnswer("");
    setCurrentEvaluation(null);
    setCollectedAnswers([]);
    setCompletedSession(null);
    setPageError("");
    setAnswerError("");
  }

  async function handleViewHistory(id: string) {
    setHistoryLoading(true);
    try {
      const session = await getInterview(id);
      setCompletedSession(session);
      setPageState("completed");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Tools</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">AI Interview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Practice with role-specific questions, get instant AI feedback, and build confidence before the real interview.
        </p>
      </div>

      {/* ── Setup / Generating ─────────────────────────────────────────── */}
      {(pageState === "setup" || pageState === "generating") && (
        <SetupCard
          values={setup}
          onChange={(v) => setSetup((p) => ({ ...p, ...v }))}
          onStart={() => void handleStart()}
          loading={pageState === "generating"}
          error={pageError}
        />
      )}

      {/* ── Active Interview ───────────────────────────────────────────── */}
      {(pageState === "interviewing" || pageState === "evaluating" || pageState === "completing") && (
        <>
          {/* Header with quit option */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{setup.jobTitle}</p>
              <p className="text-xs text-slate-400 capitalize">
                {setup.level} · {setup.type} interview · {setup.count} questions
              </p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            >
              ✕ End Session
            </button>
          </div>

          {pageError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {pageError}
            </div>
          )}

          <InterviewSessionCard
            questions={questions}
            currentIndex={currentIndex}
            pageState={pageState}
            currentAnswer={currentAnswer}
            currentEvaluation={currentEvaluation}
            onAnswerChange={setCurrentAnswer}
            onSubmit={() => void handleSubmitAnswer()}
            onNext={() => void handleNext()}
            error={answerError}
          />

          {/* Answered questions summary (scrollable sidebar-style) */}
          {collectedAnswers.length > 0 && (
            <Panel className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Answered ({collectedAnswers.length}/{questions.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {collectedAnswers.map((a) => {
                  const score = a.evaluation.score;
                  const bg =
                    score >= 7.5 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    score >= 5   ? "bg-amber-100 text-amber-700 border-amber-200" :
                                   "bg-rose-100 text-rose-700 border-rose-200";
                  return (
                    <span key={a.index} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${bg}`}>
                      Q{a.index + 1} <span className="opacity-70">· {score.toFixed(1)}</span>
                    </span>
                  );
                })}
              </div>
            </Panel>
          )}
        </>
      )}

      {/* ── Final Report ───────────────────────────────────────────────── */}
      {pageState === "completed" && completedSession && (
        <FinalReportCard session={completedSession} onRetry={handleRetry} />
      )}

      {/* ── History ────────────────────────────────────────────────────── */}
      {(pageState === "setup" || pageState === "completed") && (
        <HistoryPanel
          sessions={sessions}
          onView={(id) => void handleViewHistory(id)}
          loading={historyLoading}
        />
      )}
    </div>
  );
}
