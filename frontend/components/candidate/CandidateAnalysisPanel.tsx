"use client";

import { useTranslations } from "next-intl";

import { analysisFreshness, scoreColor, scoreText } from "./utils";
import type { CandidateDetail, ScreeningReport, ScreeningScores } from "./types";

// ─── Shared visual helpers ────────────────────────────────────────────────────

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

function ScoreLine({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 10) * 100);
  const color =
    pct >= 75 ? "bg-emerald-500" : pct >= 55 ? "bg-violet-500" : pct >= 40 ? "bg-amber-400" : "bg-rose-400";
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

const DECISION_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "Strong Hire": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Consider":    { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500" },
  "Weak":        { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400" },
  "Reject":      { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-500" },
};

type GptPayload = { strengths?: string[]; gaps?: string[]; hiring_suggestion?: string; recommendation?: string };
function isGptPayload(payload: unknown): payload is GptPayload {
  return typeof payload === "object" && payload !== null && "hiring_suggestion" in payload;
}

// ─── Job Analysis Section ─────────────────────────────────────────────────────

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

// ─── CandidateAnalysisPanel ───────────────────────────────────────────────────

type Props = {
  report: ScreeningReport | null;
  detail: CandidateDetail;
  onRegenerate: () => void;
  regenerating: boolean;
  timedOut: boolean;
};

export function CandidateAnalysisPanel({ report, detail, onRegenerate, regenerating, timedOut }: Props) {
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
    [t("screening.scoreLabels.coreSkillsMatch"),    "core_skills_match"],
    [t("screening.scoreLabels.stability"),           "stability"],
    [t("screening.scoreLabels.growthAndProgression"), "growth_and_progression"],
    [t("screening.scoreLabels.roleFit"),             "role_fit"],
  ];

  return (
    <div className="space-y-5">
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

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("screening.executiveSummary")}</p>
        <p className="text-sm leading-6 text-slate-700">{d.executive_summary}</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("screening.scoringCriteria")}</p>
        {scoreItems.map(([label, key]) => (
          <ScoreLine key={key} label={label} value={scores[key]} />
        ))}
        <div className="pt-2 border-t border-slate-100">
          <ScoreLine label={t("screening.scoreLabels.finalScoreAvg")} value={scores.final_score} />
        </div>
      </div>

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

      <JobAnalysisSection detail={detail} />

      <div className="flex justify-end">
        <button type="button" onClick={onRegenerate} disabled={regenerating}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40">
          {regenerating ? t("screening.regenerating") : t("screening.regenerate")}
        </button>
      </div>
    </div>
  );
}
