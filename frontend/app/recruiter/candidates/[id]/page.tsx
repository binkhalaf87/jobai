"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { api, getApiBaseUrl } from "@/lib/api";
import { Panel } from "@/components/panel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "new" | "shortlisted" | "interview" | "rejected";

type JobMatch = {
  job_id: string;
  job_title: string;
  overall_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
  raw_payload?: Record<string, unknown>;
};

type TopRecommendation = {
  job_title: string;
  reason: string;
};

type CandidateDetail = {
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

type Tab = "screening" | "matches" | "preview" | "notes" | "interview";

// ─── Screening Report types ───────────────────────────────────────────────────

type ScreeningScores = {
  relevant_experience: number;
  core_skills_match: number;
  stability: number;
  growth_and_progression: number;
  role_fit: number;
  final_score: number;
};

type ScreeningRecommendation = {
  decision: string;
  action: string;
  reason: string;
};

type ScreeningData = {
  executive_summary: string;
  scores: ScreeningScores;
  decision: string;
  why_hire: string[];
  risks: string[];
  recommendation: ScreeningRecommendation;
  quick_flags: string[];
};

type ScreeningReport = {
  id: string;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
  report: ScreeningData | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_OPTIONS: { value: Stage; cls: string }[] = [
  { value: "new",        cls: "text-sky-700 bg-sky-50 border-sky-200" },
  { value: "shortlisted",cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "interview",  cls: "text-violet-700 bg-violet-50 border-violet-200" },
  { value: "rejected",   cls: "text-rose-600 bg-rose-50 border-rose-200" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function analysisFreshness(completedAt: string | null): { hours: number; days: number | null; stale: boolean } | null {
  if (!completedAt) return null;
  const hours = (Date.now() - new Date(completedAt).getTime()) / 3_600_000;
  if (hours < 24) return { hours, days: null, stale: false };
  const days = Math.floor(hours / 24);
  return { hours, days, stale: days > 7 };
}

function scoreColor(s: number) {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function scoreText(s: number) {
  if (s >= 70) return "text-emerald-700";
  if (s >= 40) return "text-amber-700";
  return "text-rose-600";
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Next Step logic ──────────────────────────────────────────────────────────

type NextStep = { messageKey: string; action: string; variant: "primary" | "warning" | "neutral" };

function computeNextStep(detail: CandidateDetail, hasJobs: boolean): NextStep | null {
  if (detail.status !== "parsed") {
    return { messageKey: "nextStepMessages.processing", action: "", variant: "neutral" };
  }
  if (detail.matches.length === 0 && !hasJobs) {
    return {
      messageKey: "nextStepMessages.noJobs",
      action: "Go to Jobs →",
      variant: "warning",
    };
  }
  if (detail.matches.length === 0 && hasJobs) {
    return {
      messageKey: "nextStepMessages.notAnalyzed",
      action: "Run Analysis",
      variant: "primary",
    };
  }
  const freshness = analysisFreshness(detail.analysis_completed_at);
  if (freshness?.stale) {
    return {
      messageKey: "nextStepMessages.stale",
      action: "Refresh Analysis",
      variant: "warning",
    };
  }
  // 0% on all jobs = likely a language mismatch, not a bad candidate
  if (detail.matches.length > 0 && detail.matches.every((m) => m.overall_score === 0)) {
    return {
      messageKey: "nextStepMessages.zeroScores",
      action: "Deep AI Analysis",
      variant: "warning",
    };
  }

  if (detail.matches.every((m) => m.overall_score < 40)) {
    return {
      messageKey: "nextStepMessages.lowScores",
      action: "Reject",
      variant: "warning",
    };
  }
  if (detail.stage === "new" && detail.matches.some((m) => m.overall_score >= 70)) {
    return {
      messageKey: "nextStepMessages.strongMatch",
      action: "Shortlist",
      variant: "primary",
    };
  }
  if (detail.stage === "shortlisted") {
    return {
      messageKey: "nextStepMessages.shortlisted",
      action: "Move to Interview",
      variant: "primary",
    };
  }
  if (detail.stage === "interview") {
    return {
      messageKey: "nextStepMessages.interview",
      action: "Add Notes",
      variant: "neutral",
    };
  }
  if (detail.stage === "rejected") {
    return null;
  }
  return {
    messageKey: "nextStepMessages.review",
    action: "Review Matches",
    variant: "neutral",
  };
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ value, label }: { value: number | null; label: string }) {
  const v = value ?? 0;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, v)) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg className="-rotate-90" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r={radius} stroke="#f1f5f9" strokeWidth="4" />
          <circle
            cx="28" cy="28" r={radius}
            stroke={value === null ? "#e2e8f0" : v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#f43f5e"}
            strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
          value === null ? "text-slate-300" : v >= 70 ? "text-emerald-700" : v >= 40 ? "text-amber-700" : "text-rose-600"
        }`}>
          {value === null ? "—" : `${v.toFixed(0)}%`}
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const c = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${scoreColor(c)}`} style={{ width: `${c}%` }} />
      </div>
      <span className={`w-12 text-right text-xs font-bold tabular-nums ${scoreText(c)}`}>
        {c.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Tab: Screening Report ────────────────────────────────────────────────────

const DECISION_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "Strong Hire": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Consider":    { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500"  },
  "Weak":        { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400"   },
  "Reject":      { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-500"    },
};

function ScoreLine({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 10) * 100);
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 55 ? "bg-violet-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 flex-shrink-0 text-xs text-slate-600">{label}</span>
      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-bold tabular-nums text-slate-700">{value}/10</span>
    </div>
  );
}

type GptPayload = {
  strengths?: string[];
  gaps?: string[];
  hiring_suggestion?: string;
  recommendation?: string;
};
function isGptPayload(payload: unknown): payload is GptPayload {
  return typeof payload === "object" && payload !== null && "hiring_suggestion" in payload;
}

function JobAnalysisSection({ detail }: { detail: CandidateDetail }) {
  const t = useTranslations("recruiter.candidateDetailPage");
  const bestMatch = detail.matches[0] ?? null;
  if (!bestMatch) return null;

  const freshness = analysisFreshness(detail.analysis_completed_at);
  const freshnessLabel = freshness
    ? freshness.days === null
      ? t("freshness.fresh", { hours: Math.round(freshness.hours) })
      : freshness.days === 1
        ? t("freshness.days_one", { days: 1 })
        : t("freshness.days_other", { days: freshness.days })
    : null;
  const gptData = bestMatch.raw_payload && isGptPayload(bestMatch.raw_payload) ? bestMatch.raw_payload : null;
  const strengths = gptData?.strengths?.length ? gptData.strengths : bestMatch.matching_keywords.slice(0, 6);
  const gaps = gptData?.gaps?.length ? gptData.gaps : bestMatch.missing_keywords.slice(0, 6);
  const isGptStrings = !gptData?.strengths?.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("jobAnalysis.sectionTitle")}</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {freshness && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${
          freshness.stale ? "border-amber-200 bg-amber-50" : "border-emerald-100 bg-emerald-50"
        }`}>
          <p className={`text-xs font-semibold ${freshness.stale ? "text-amber-700" : "text-emerald-700"}`}>
            {freshness.stale ? t("jobAnalysis.stale") : t("jobAnalysis.current")}
          </p>
          <span className={`text-xs ${freshness.stale ? "text-amber-600" : "text-emerald-600"}`}>{freshnessLabel}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{t("jobAnalysis.bestJobMatch")}</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{bestMatch.job_title}</p>
            {gptData?.hiring_suggestion && (
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                gptData.hiring_suggestion === "shortlist" ? "bg-emerald-100 text-emerald-700" :
                gptData.hiring_suggestion === "interview" ? "bg-violet-100 text-violet-700" :
                gptData.hiring_suggestion === "reject"    ? "bg-rose-100 text-rose-700" :
                "bg-slate-100 text-slate-600"
              }`}>{String(gptData.hiring_suggestion)}</span>
            )}
          </div>
          <span className={`text-2xl font-bold tabular-nums ${scoreText(bestMatch.overall_score)}`}>
            {bestMatch.overall_score.toFixed(1)}%
          </span>
        </div>
        <div className="mt-3"><ScoreBar score={bestMatch.overall_score} /></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">{t("jobAnalysis.strengths")}</p>
          {isGptStrings ? (
            <div className="flex flex-wrap gap-1.5">
              {(strengths as string[]).map((k) => (
                <span key={k} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{k}</span>
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {(strengths as string[]).map((s, i) => (
                <li key={i} className="text-xs leading-5 text-emerald-800">· {s}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-amber-600">{t("jobAnalysis.gaps")}</p>
          {isGptStrings ? (
            <div className="flex flex-wrap gap-1.5">
              {(gaps as string[]).map((k) => (
                <span key={k} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{k}</span>
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {(gaps as string[]).map((g, i) => (
                <li key={i} className="text-xs leading-5 text-amber-800">· {g}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {detail.skills.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{t("jobAnalysis.allExtractedSkills")}</p>
          <div className="flex flex-wrap gap-2">
            {detail.skills.map((skill) => {
              const isMatch = bestMatch.matching_keywords.map((k) => k.toLowerCase()).includes(skill.toLowerCase());
              const isGap = bestMatch.missing_keywords.map((k) => k.toLowerCase()).includes(skill.toLowerCase());
              return (
                <span key={skill} className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  isMatch ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                  isGap   ? "border-amber-200 bg-amber-50 text-amber-700" :
                            "border-slate-200 bg-slate-50 text-slate-600"
                }`}>{skill}</span>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{t("jobAnalysis.skillLegend")}</p>
        </div>
      )}
    </div>
  );
}

function TabScreening({
  report,
  detail,
  onRegenerate,
  regenerating,
  timedOut,
}: {
  report: ScreeningReport | null;
  detail: CandidateDetail;
  onRegenerate: () => void;
  regenerating: boolean;
  timedOut: boolean;
}) {
  const t = useTranslations("recruiter.candidateDetailPage");
  const hasJobMatches = detail.matches.length > 0;

  if (!report || report.status === "pending") {
    if (timedOut) {
      return (
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-amber-700">{t("screening.timedOut")}</p>
            <button type="button" onClick={onRegenerate} disabled={regenerating}
              className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
              {regenerating ? t("screening.starting") : t("screening.generateReport")}
            </button>
          </div>
          {hasJobMatches && <JobAnalysisSection detail={detail} />}
        </div>
      );
    }
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center space-y-3">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-violet-600" />
          <p className="text-sm font-semibold text-slate-700">{t("screening.pending")}</p>
          <p className="text-xs text-slate-400">{t("screening.pendingDesc")}</p>
        </div>
        {hasJobMatches && <JobAnalysisSection detail={detail} />}
      </div>
    );
  }

  if (report.status === "failed" || !report.report) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-700">{t("screening.failed")}</p>
          <button type="button" onClick={onRegenerate} disabled={regenerating}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
            {regenerating ? t("screening.retrying") : t("screening.retry")}
          </button>
        </div>
        {hasJobMatches && <JobAnalysisSection detail={detail} />}
      </div>
    );
  }

  const d = report.report;
  const ds = DECISION_STYLES[d.decision] ?? DECISION_STYLES["Consider"];
  const scores = d.scores;
  const scoreItems: [string, keyof Omit<ScreeningScores, "final_score">][] = [
    [t("screening.scoreLabels.relevantExperience"), "relevant_experience"],
    [t("screening.scoreLabels.coreSkillsMatch"),   "core_skills_match"],
    [t("screening.scoreLabels.stability"),          "stability"],
    [t("screening.scoreLabels.growthAndProgression"),"growth_and_progression"],
    [t("screening.scoreLabels.roleFit"),            "role_fit"],
  ];

  return (
    <div className="space-y-5">
      {/* ── Decision banner ── */}
      <div className={`rounded-2xl border ${ds.border} ${ds.bg} px-5 py-4 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${ds.dot} flex-shrink-0`} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("screening.eyebrow")}</p>
            <p className={`text-xl font-bold ${ds.text}`}>{d.decision}</p>
            <p className="text-xs text-slate-500 mt-0.5">{d.recommendation.action}</p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{t("screening.finalScore")}</p>
          <p className={`text-3xl font-black tabular-nums ${ds.text}`}>{scores.final_score.toFixed(1)}</p>
          <p className="text-[10px] text-slate-400">{t("screening.outOf10")}</p>
        </div>
      </div>

      {/* ── Executive summary ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("screening.executiveSummary")}</p>
        <p className="text-sm leading-6 text-slate-700">{d.executive_summary}</p>
      </div>

      {/* ── Score breakdown ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("screening.scoringCriteria")}</p>
        {scoreItems.map(([label, key]) => (
          <ScoreLine key={key} label={label} value={scores[key]} />
        ))}
        <div className="pt-2 border-t border-slate-100">
          <ScoreLine label={t("screening.scoreLabels.finalScoreAvg")} value={scores.final_score} />
        </div>
      </div>

      {/* ── Why Hire + Risks ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">{t("screening.whyHire")}</p>
          <ul className="space-y-2">
            {d.why_hire.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-5 text-emerald-800">
                <span className="mt-0.5 flex-shrink-0 text-emerald-400">✓</span>{r}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">{t("screening.risks")}</p>
          <ul className="space-y-2">
            {d.risks.map((r, i) => (
              <li key={i} className="flex gap-2 text-xs leading-5 text-rose-800">
                <span className="mt-0.5 flex-shrink-0 text-rose-400">✕</span>{r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Recommendation ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("screening.finalRecommendation")}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`rounded-full px-3 py-1 text-xs font-bold border ${ds.bg} ${ds.text} ${ds.border}`}>
            {d.recommendation.decision}
          </span>
          <span className="text-xs text-slate-400">→</span>
          <span className="text-xs font-semibold text-slate-700">{d.recommendation.action}</span>
        </div>
        <p className="mt-2 text-xs text-slate-500 leading-5">{d.recommendation.reason}</p>
      </div>

      {/* ── Quick flags ── */}
      {d.quick_flags.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("screening.quickFlags")}</p>
          <div className="flex flex-wrap gap-2">
            {d.quick_flags.map((f) => (
              <span key={f} className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{f}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Job Analysis section (merged) ── */}
      <JobAnalysisSection detail={detail} />

      {/* ── Re-generate ── */}
      <div className="flex justify-end">
        <button type="button" onClick={onRegenerate} disabled={regenerating}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40">
          {regenerating ? t("screening.regenerating") : t("screening.regenerate")}
        </button>
      </div>
    </div>
  );
}

// ─── Tab: Job Matches ─────────────────────────────────────────────────────────

function TabMatches({ detail }: { detail: CandidateDetail }) {
  const t = useTranslations("recruiter.candidateDetailPage");

  if (detail.matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">{t("matches.noMatches")}</p>
        <p className="mt-2 text-xs text-slate-500">
          {t("matches.noMatchesDesc")}
        </p>
        <Link
          href="/recruiter/jobs"
          className="mt-4 inline-block rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white"
        >
          {t("matches.goToJobs")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {detail.matches.map((match) => (
        <li key={match.job_id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">{match.job_title}</p>
            <span className={`text-lg font-bold tabular-nums ${scoreText(match.overall_score)}`}>
              {match.overall_score.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <ScoreBar score={match.overall_score} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {match.matching_keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-emerald-600">{t("matches.matched")}</p>
                <p className="text-xs text-slate-600">
                  {match.matching_keywords.slice(0, 6).join(", ")}
                  {match.matching_keywords.length > 6 && ` +${match.matching_keywords.length - 6}`}
                </p>
              </div>
            )}
            {match.missing_keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-amber-600">{t("matches.missing")}</p>
                <p className="text-xs text-slate-600">
                  {match.missing_keywords.slice(0, 6).join(", ")}
                  {match.missing_keywords.length > 6 && ` +${match.missing_keywords.length - 6}`}
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Tab: Preview ─────────────────────────────────────────────────────────────

function TabPreview({ detail }: { detail: CandidateDetail }) {
  const t = useTranslations("recruiter.candidateDetailPage");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.file_available) return;

    setLoadingFile(true);
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("jobai_access_token")
        : null;

    let objectUrl: string | null = null;

    fetch(`${getApiBaseUrl()}/recruiter/candidates/${detail.id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load file.");
        return r.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setFileError("Could not load the resume file."))
      .finally(() => setLoadingFile(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id, detail.file_available]);

  function handlePrint() {
    if (!blobUrl) return;
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      // Fallback: open in new tab for printing
      window.open(blobUrl, "_blank");
    }
  }

  function handleOpen() {
    if (blobUrl) window.open(blobUrl, "_blank");
  }

  // ── File not available — fall back to extracted text ─────────────────────
  if (!detail.file_available) {
    if (detail.raw_text) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-amber-600">⚠</span>
            <p className="text-xs text-amber-800">
              {t("preview.fileNotAvailable")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-slate-700">
              {detail.raw_text}
            </pre>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">{t("preview.notAvailableTitle")}</p>
        <p className="mt-2 text-xs text-slate-500">
          {t("preview.notAvailableDesc")}
        </p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingFile) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          {t("preview.loading")}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (fileError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">{fileError}</p>
      </div>
    );
  }

  const isPdf = (detail.file_type || "").toLowerCase() === "pdf";

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
            isPdf ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
          }`}>
            {(detail.file_type || "FILE").toUpperCase()}
          </span>
          {detail.source_filename && (
            <span className="max-w-[200px] truncate text-xs text-slate-500">{detail.source_filename}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpen}
            disabled={!blobUrl}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
          >
            {t("preview.open")}
          </button>
          {isPdf && (
            <button
              type="button"
              onClick={handlePrint}
              disabled={!blobUrl}
              className="rounded-xl bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              {t("preview.print")}
            </button>
          )}
          {!isPdf && blobUrl && (
            <a
              href={blobUrl}
              download={detail.source_filename ?? `resume.${detail.file_type}`}
              className="rounded-xl bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
            >
              {t("preview.download")}
            </a>
          )}
        </div>
      </div>

      {/* Preview area */}
      {isPdf && blobUrl ? (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          title="Resume Preview"
          className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white"
        />
      ) : !isPdf && blobUrl ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{t("preview.wordDoc")}</p>
            <p className="mt-1 text-xs text-slate-500">
              {t("preview.wordDocDesc")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Tab: Notes ───────────────────────────────────────────────────────────────

type Note = { id: string; text: string; date: string };

function TabNotes({ candidateId }: { candidateId: string }) {
  const t = useTranslations("recruiter.candidateDetailPage");
  const storageKey = `jobai_notes_${candidateId}`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setNotes(JSON.parse(raw) as Note[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  function saveNotes(updated: Note[]) {
    setNotes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function addNote() {
    if (!draft.trim()) return;
    const note: Note = {
      id: Math.random().toString(36).slice(2),
      text: draft.trim(),
      date: new Date().toISOString(),
    };
    saveNotes([note, ...notes]);
    setDraft("");
  }

  function deleteNote(id: string) {
    saveNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("notes.placeholder")}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={addNote}
            disabled={!draft.trim()}
            className="rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40"
          >
            {t("notes.save")}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-center text-xs text-slate-400">{t("notes.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-6 text-slate-800">{note.text}</p>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="flex-shrink-0 text-xs text-slate-300 transition hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{fmtDate(note.date)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Tab: Interview ───────────────────────────────────────────────────────────

type CandidateInterview = {
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

type InterviewQuestion = { index: number; question: string; type: string; focus_area: string | null };
type InterviewDetail = CandidateInterview & { questions: InterviewQuestion[]; candidate_summary: string; focus_areas: string[] };

type ResponseItem = { question_index: number; question_text: string; text_answer: string | null; has_video: boolean };
type QuestionFeedback = { index: number; score: number; feedback: string; strength: string; weakness: string };
type InterviewResponses = {
  interview_id: string;
  overall_score: number | null;
  overall_impression: string | null;
  hire_recommendation: string | null;
  per_question: QuestionFeedback[];
  responses: ResponseItem[];
};

function TabInterview({ candidateId }: { candidateId: string }) {
  const [interviews, setInterviews] = useState<CandidateInterview[]>([]);
  const [selected, setSelected] = useState<InterviewDetail | null>(null);
  const [responses, setResponses] = useState<InterviewResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    api.get<CandidateInterview[]>("/recruiter/interviews/", { auth: true })
      .then((all) => {
        const mine = all.filter((iv) => iv.resume_id === candidateId);
        setInterviews(mine);
        if (mine.length > 0) void loadDetail(mine[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  async function loadDetail(id: string) {
    try {
      const iv = await api.get<InterviewDetail>(`/recruiter/interviews/${id}`, { auth: true });
      setSelected(iv);
      setResponses(null);
      if (iv.response_status === "completed") {
        const r = await api.get<InterviewResponses>(`/recruiter/interviews/${id}/responses`, { auth: true });
        setResponses(r);
      }
    } catch { /* ignore */ }
  }

  async function handleWhatsApp(interviewId: string) {
    setGeneratingLink(true);
    try {
      const res = await api.post<{ link: string; candidate_name: string; job_title: string; language: string }>(
        `/recruiter/interviews/${interviewId}/link`, {}, { auth: true }
      );
      const isAr = res.language === "ar";
      const msg = isAr
        ? `مرحباً ${res.candidate_name}،\n\nتمت دعوتك لإجراء مقابلة فيديو ذكية لوظيفة: ${res.job_title}\n\nيرجى الضغط على الرابط للبدء:\n${res.link}`
        : `Hi ${res.candidate_name},\n\nYou've been invited for an AI video interview for: ${res.job_title}\n\nClick the link to start:\n${res.link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      setWaLink(res.link);
    } catch { /* ignore */ } finally {
      setGeneratingLink(false);
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;

  if (interviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">No interviews yet</p>
        <p className="mt-1 text-xs text-slate-500">Go to the AI Interview page to generate questions for this candidate.</p>
        <Link href="/recruiter/ai-interview"
          className="mt-4 inline-block rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700">
          Go to AI Interview →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interview selector */}
      {interviews.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {interviews.map((iv) => (
            <button key={iv.id} type="button"
              onClick={() => void loadDetail(iv.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                selected?.id === iv.id
                  ? "border-brand-800 bg-brand-50 text-brand-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {iv.job_title}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          {/* Header + WhatsApp */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{selected.interview_type.toUpperCase()} · {selected.question_count} questions</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{selected.job_title}</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                selected.response_status === "completed" ? "bg-teal-100 text-teal-700" :
                selected.response_status === "in_progress" ? "bg-blue-100 text-blue-700" :
                selected.response_status === "sent" ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-600"
              }`}>{selected.response_status}</span>
            </div>
            {selected.response_status !== "completed" && (
              <button type="button" onClick={() => void handleWhatsApp(selected.id)} disabled={generatingLink}
                className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1ebe5d] disabled:opacity-50">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {generatingLink ? "Generating…" : "Send via WhatsApp"}
              </button>
            )}
          </div>

          {waLink && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs text-teal-700">
              Interview link: <span className="font-mono break-all">{waLink}</span>
            </div>
          )}

          {/* Interview responses (if completed) */}
          {responses && (
            <div className="space-y-4">
              {responses.overall_score !== null && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-semibold text-slate-700">Overall Score</p>
                  <span className={`text-2xl font-bold tabular-nums ${
                    responses.overall_score >= 70 ? "text-emerald-700" :
                    responses.overall_score >= 40 ? "text-amber-700" : "text-rose-600"
                  }`}>{responses.overall_score}/100</span>
                </div>
              )}
              {responses.overall_impression && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2">Overall Impression</p>
                  <p className="text-sm leading-6 text-slate-700">{responses.overall_impression}</p>
                </div>
              )}
              <div className="space-y-3">
                {responses.responses.map((resp) => {
                  const fb = responses.per_question.find((pq) => pq.index === resp.question_index);
                  return (
                    <div key={resp.question_index} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 flex-shrink-0">
                          {resp.question_index + 1}
                        </span>
                        <p className="text-sm font-medium text-slate-800">{resp.question_text}</p>
                      </div>
                      {resp.text_answer && (
                        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-xs leading-6 text-slate-700">{resp.text_answer}</p>
                        </div>
                      )}
                      {fb && (
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap gap-2">
                            {fb.strength && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">✓ {fb.strength}</span>}
                            {fb.weakness && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">✕ {fb.weakness}</span>}
                          </div>
                          <span className={`font-bold tabular-nums ${fb.score >= 7 ? "text-emerald-700" : fb.score >= 5 ? "text-amber-700" : "text-rose-600"}`}>
                            {fb.score}/10
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Questions list (if no responses yet) */}
          {!responses && selected.questions && selected.questions.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interview Questions</p>
              {selected.questions.map((q) => (
                <div key={q.index} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 flex-shrink-0">
                      {q.index + 1}
                    </span>
                    <div>
                      <p className="text-sm leading-6 text-slate-900">{q.question}</p>
                      {q.focus_area && <p className="mt-1 text-xs text-slate-400">{q.focus_area}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateProfilePage() {
  const t = useTranslations("recruiter.candidateDetailPage");
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("screening");
  const [stagePending, setStagePending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasJobs, setHasJobs] = useState(false);
  const [screening, setScreening] = useState<ScreeningReport | null>(null);
  const [screeningTimedOut, setScreeningTimedOut] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const [data, jobs, screen] = await Promise.all([
          api.get<CandidateDetail>(`/recruiter/candidates/${id}`, { auth: true }),
          api.get<{ id: string }[]>("/recruiter/jobs/", { auth: true }),
          api.get<ScreeningReport | null>(`/recruiter/candidates/${id}/screening`, { auth: true }).catch(() => null),
        ]);
        setDetail(data);
        setHasJobs(jobs.length > 0);
        setScreening(screen);
        if (!screen || screen.status === "pending") schedulePoll();
      } catch {
        setError(t("error.failedToLoad"));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function schedulePoll() {
    if (pollCountRef.current >= 20) {
      setScreeningTimedOut(true);
      return;
    }
    pollCountRef.current += 1;
    pollRef.current = setTimeout(async () => {
      try {
        const screen = await api.get<ScreeningReport | null>(`/recruiter/candidates/${id}/screening`, { auth: true });
        setScreening(screen);
        if (!screen || screen.status === "pending") schedulePoll();
      } catch { /* ignore */ }
    }, 4000);
  }

  async function handleRegenerate() {
    if (regenerating) return;
    setRegenerating(true);
    pollCountRef.current = 0;
    setScreeningTimedOut(false);
    try {
      const screen = await api.post<ScreeningReport>(`/recruiter/candidates/${id}/screening`, undefined, { auth: true });
      setScreening(screen);
      schedulePoll();
    } catch { /* ignore */ } finally {
      setRegenerating(false);
    }
  }

  async function handleRunAnalysis(forceRefresh = false) {
    if (!detail || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await api.post<{
        analyses_created: number;
        has_resume_text: boolean;
        warning: string | null;
      }>(
        `/recruiter/candidates/${id}/analyze`,
        forceRefresh ? { force_refresh: true } : undefined,
        { auth: true }
      );

      if (!result.has_resume_text) {
        setAnalyzeError(result.warning ?? "No text found in resume.");
      } else if (result.warning) {
        setAnalyzeError(result.warning);
      }

      // Reload detail regardless — even 0% scores should show
      const data = await api.get<CandidateDetail>(`/recruiter/candidates/${id}`, { auth: true });
      setDetail(data);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : t("error.analysisFailed"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleStageChange(stage: Stage) {
    if (!detail || stagePending) return;
    setStagePending(true);
    const prev = detail.stage;
    setDetail({ ...detail, stage }); // optimistic
    try {
      await api.patch(`/recruiter/candidates/${id}/stage`, { stage }, { auth: true });
    } catch {
      setDetail({ ...detail, stage: prev }); // revert
    } finally {
      setStagePending(false);
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <Panel className="p-8">
        <p className="text-sm font-semibold text-rose-600">{error ?? t("error.notFound")}</p>
        <Link href="/recruiter/candidates" className="mt-4 inline-block text-xs font-medium text-slate-500 underline">
          {t("error.backToCandidates")}
        </Link>
      </Panel>
    );
  }

  const nextStep = computeNextStep(detail, hasJobs);
  const topScore = detail.matches[0]?.overall_score ?? null;
  const stageOption = STAGE_OPTIONS.find((s) => s.value === detail.stage)!;
  const displayName = detail.parsed_name ?? detail.title;

  const TABS: { key: Tab; label: string }[] = [
    { key: "screening", label: t("tabs.screening") },
    { key: "matches", label: detail.matches.length > 0 ? t("tabs.jobMatchesWithCount", { count: detail.matches.length }) : t("tabs.jobMatches") },
    { key: "interview", label: t("tabs.interview") },
    { key: "preview", label: t("tabs.resume") },
    { key: "notes", label: t("tabs.notes") },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Back link ──────────────────────────────────────────── */}
      <Link
        href="/recruiter/candidates"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700"
      >
        {t("backToCandidates")}
      </Link>

      {/* ── Sticky header card ─────────────────────────────────── */}
      <Panel className="sticky top-0 z-10 p-5 md:p-6">
        <div className="flex flex-wrap items-start gap-4">

          {/* Avatar + info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-sm font-bold text-white">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-slate-950">{displayName}</h1>
              {detail.parsed_name && detail.parsed_name !== detail.title && (
                <p className="text-xs text-slate-400">{t("resumeFile", { title: detail.title })}</p>
              )}
              {detail.email && (
                <p className="text-xs text-slate-400">{detail.email}</p>
              )}
              <p className="mt-0.5 text-xs text-slate-400">{t("added", { date: fmtDate(detail.created_at) })}</p>
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-4">
            <ScoreRing value={topScore} label={t("matchLabel")} />
          </div>

          {/* Stage selector */}
          <div className="flex-shrink-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t("stageLabel")}</p>
            <div className="relative">
              <select
                value={detail.stage}
                disabled={stagePending}
                onChange={(e) => void handleStageChange(e.target.value as Stage)}
                className={`appearance-none rounded-xl border px-3 py-2 pr-7 text-xs font-semibold outline-none transition cursor-pointer ${stageOption.cls}`}
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{t(`stageOptions.${opt.value}`)}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-60">▾</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Next Step panel ─────────────────────────────────────── */}
      {nextStep && (
        <div className={`rounded-2xl border px-5 py-4 ${
          nextStep.variant === "primary" ? "border-emerald-200 bg-emerald-50" :
          nextStep.variant === "warning" ? "border-amber-200 bg-amber-50" :
          "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 text-sm ${
                nextStep.variant === "primary" ? "text-emerald-600" :
                nextStep.variant === "warning" ? "text-amber-600" : "text-slate-400"
              }`}>
                {nextStep.variant === "primary" ? "→" : nextStep.variant === "warning" ? "⚠" : "·"}
              </span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${
                  nextStep.variant === "primary" ? "text-emerald-600" :
                  nextStep.variant === "warning" ? "text-amber-600" : "text-slate-400"
                }`}>
                  {t("nextStep")}
                </p>
                <p className={`mt-0.5 text-sm leading-6 ${
                  nextStep.variant === "primary" ? "text-emerald-800" :
                  nextStep.variant === "warning" ? "text-amber-800" : "text-slate-600"
                }`}>
                  {t(nextStep.messageKey)}
                </p>
              </div>
            </div>

            {nextStep.action && (
              <>
                {nextStep.action === "Shortlist" && (
                  <button
                    type="button"
                    onClick={() => void handleStageChange("shortlisted")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    {t("actions.shortlist")}
                  </button>
                )}
                {nextStep.action === "Reject" && (
                  <button
                    type="button"
                    onClick={() => void handleStageChange("rejected")}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  >
                    {t("actions.reject")}
                  </button>
                )}
                {nextStep.action === "Move to Interview" && (
                  <button
                    type="button"
                    onClick={() => void handleStageChange("interview")}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                  >
                    {t("actions.moveToInterview")}
                  </button>
                )}
                {(nextStep.action === "Run Analysis" ||
                  nextStep.action === "Refresh Analysis" ||
                  nextStep.action === "Re-run Analysis" ||
                  nextStep.action === "Deep AI Analysis") && (
                  <button
                    type="button"
                    disabled={analyzing}
                    onClick={() =>
                      void handleRunAnalysis(
                        nextStep.action === "Refresh Analysis" || nextStep.action === "Deep AI Analysis"
                      )
                    }
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    {analyzing ? t("actions.running") : t("actions.analyzeWithAi")}
                  </button>
                )}
                {nextStep.action === "Go to Jobs →" && (
                  <Link
                    href="/recruiter/jobs"
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                  >
                    {t("actions.goToJobs")}
                  </Link>
                )}
                {nextStep.action === "Add Notes" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("notes")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {t("actions.addNotes")}
                  </button>
                )}
                {nextStep.action === "Review Matches" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("matches")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {t("actions.reviewMatches")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Analyze error ──────────────────────────────────────── */}
      {analyzeError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          <span className="mr-1.5 font-bold">⚠</span>{analyzeError}
        </div>
      )}

      {/* ── Re-run AI Analysis button ────────────────────────── */}
      {detail.matches.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={analyzing}
            onClick={() => void handleRunAnalysis(true)}
            className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-40"
          >
            {analyzing ? t("actions.running") : t("actions.reRunAnalysis")}
          </button>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs font-semibold transition border-b-2 ${
                activeTab === tab.key
                  ? "border-brand-800 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content ─────────────────────────────────────────── */}
      <div className="pb-8">
        {activeTab === "screening" && (
          <TabScreening
            report={screening}
            detail={detail}
            onRegenerate={() => void handleRegenerate()}
            regenerating={regenerating}
            timedOut={screeningTimedOut}
          />
        )}
        {activeTab === "matches" && <TabMatches detail={detail} />}
        {activeTab === "interview" && <TabInterview candidateId={id} />}
        {activeTab === "preview" && <TabPreview detail={detail} />}
        {activeTab === "notes" && <TabNotes candidateId={id} />}
      </div>

    </div>
  );
}
