import type { CandidateDetail, NextStep, Stage } from "./types";

export const STAGE_OPTIONS: { value: Stage; cls: string }[] = [
  { value: "new",         cls: "text-sky-700 bg-sky-50 border-sky-200" },
  { value: "shortlisted", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "interview",   cls: "text-violet-700 bg-violet-50 border-violet-200" },
  { value: "rejected",    cls: "text-rose-600 bg-rose-50 border-rose-200" },
];

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export function analysisFreshness(
  completedAt: string | null,
): { hours: number; days: number | null; stale: boolean } | null {
  if (!completedAt) return null;
  const hours = (Date.now() - new Date(completedAt).getTime()) / 3_600_000;
  if (hours < 24) return { hours, days: null, stale: false };
  const days = Math.floor(hours / 24);
  return { hours, days, stale: days > 7 };
}

export function scoreColor(s: number): string {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

export function scoreText(s: number): string {
  if (s >= 70) return "text-emerald-700";
  if (s >= 40) return "text-amber-700";
  return "text-rose-600";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function computeNextStep(detail: CandidateDetail, hasJobs: boolean): NextStep | null {
  if (detail.status !== "parsed") {
    return { messageKey: "nextStepMessages.processing", action: "", variant: "neutral" };
  }
  if (detail.matches.length === 0 && !hasJobs) {
    return { messageKey: "nextStepMessages.noJobs", action: "Go to Jobs →", variant: "warning" };
  }
  if (detail.matches.length === 0 && hasJobs) {
    return { messageKey: "nextStepMessages.notAnalyzed", action: "Run Analysis", variant: "primary" };
  }
  const freshness = analysisFreshness(detail.analysis_completed_at);
  if (freshness?.stale) {
    return { messageKey: "nextStepMessages.stale", action: "Refresh Analysis", variant: "warning" };
  }
  if (detail.matches.length > 0 && detail.matches.every((m) => m.overall_score === 0)) {
    return { messageKey: "nextStepMessages.zeroScores", action: "Deep AI Analysis", variant: "warning" };
  }
  if (detail.matches.every((m) => m.overall_score < 40)) {
    return { messageKey: "nextStepMessages.lowScores", action: "Reject", variant: "warning" };
  }
  if (detail.stage === "new" && detail.matches.some((m) => m.overall_score >= 70)) {
    return { messageKey: "nextStepMessages.strongMatch", action: "Shortlist", variant: "primary" };
  }
  if (detail.stage === "shortlisted") {
    return { messageKey: "nextStepMessages.shortlisted", action: "Move to Interview", variant: "primary" };
  }
  if (detail.stage === "interview") {
    return { messageKey: "nextStepMessages.interview", action: "Add Notes", variant: "neutral" };
  }
  if (detail.stage === "rejected") {
    return null;
  }
  return { messageKey: "nextStepMessages.review", action: "Review Matches", variant: "neutral" };
}
