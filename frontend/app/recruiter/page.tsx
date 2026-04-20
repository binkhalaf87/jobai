"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/panel";
import { api } from "@/lib/api";

type TopMatch = {
  candidate_name: string;
  job_title: string;
  score: number;
  resume_id: string;
  job_id: string;
};

type RecentCandidate = {
  resume_id: string;
  title: string;
  best_job: string | null;
  best_score: number | null;
  uploaded_at: string;
};

type DashboardStats = {
  total_candidates: number;
  total_jobs: number;
  avg_match_score: number;
  pipeline_counts: Record<"applied" | "shortlisted" | "interview" | "rejected", number>;
  awaiting_analysis: number;
  top_matches: TopMatch[];
  recent_candidates: RecentCandidate[];
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreClass(score: number): string {
  if (score >= 70) return "text-emerald-700";
  if (score >= 40) return "text-amber-700";
  return "text-rose-600";
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const fill = clamped >= 70 ? "bg-emerald-500" : clamped >= 40 ? "bg-amber-400" : "bg-rose-400";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`w-12 text-right text-xs font-semibold ${scoreClass(clamped)}`}>{clamped.toFixed(1)}%</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <Panel className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>
    </Panel>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Panel key={index} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-8 w-16 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
            </div>
          </Panel>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {Array.from({ length: 2 }, (_, index) => (
          <Panel key={index} className="p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-6 w-52 rounded bg-slate-200" />
              <div className="h-32 rounded bg-slate-100" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

export default function RecruiterDashboardPage() {
  const t = useTranslations("recruiter.dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.get<DashboardStats>("/recruiter/dashboard/stats", { auth: true });
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError(t("failedToLoad"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  if (loading) return <LoadingState />;

  if (error || !stats) {
    return (
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{t("eyebrow")}</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{error ?? t("noData")}</h1>
      </Panel>
    );
  }

  const pipelineTotal = Object.values(stats.pipeline_counts).reduce((sum, value) => sum + value, 0);
  const shortlistedRatio = pipelineTotal > 0 ? Math.round((stats.pipeline_counts.shortlisted / pipelineTotal) * 100) : 0;
  const nextActionHref =
    stats.total_jobs === 0
      ? "/recruiter/jobs"
      : stats.awaiting_analysis > 0
        ? "/recruiter/candidates"
        : "/recruiter/candidates";
  const nextActionLabel =
    stats.total_jobs === 0
      ? t("nextStep.postJob")
      : stats.awaiting_analysis > 0
        ? t("nextStep.runAnalysis")
        : t("nextStep.reviewTopCandidates");
  const nextActionDescription =
    stats.total_jobs === 0
      ? t("nextStep.addJobDesc")
      : stats.awaiting_analysis > 0
        ? t("nextStep.waitingAnalysis", { count: stats.awaiting_analysis })
        : t("nextStep.pipelineReady");

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_55%),linear-gradient(135deg,_#ffffff_0%,_#eef4ff_46%,_#f8fafc_100%)] px-8 py-8 md:px-10 md:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{t("eyebrow")}</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              {t("description")}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("pipeline.label")}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{shortlistedRatio}%</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t("pipeline.alreadyShortlisted")}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("nextStep.label")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{nextActionLabel}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{nextActionDescription}</p>
              </div>
              <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("coverage.label")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">
                  {stats.total_jobs > 0
                    ? (stats.total_jobs === 1 ? t("coverage.activeRoles_one", { count: 1 }) : t("coverage.activeRoles_other", { count: stats.total_jobs }))
                    : t("coverage.noActiveJobs")}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t("coverage.rankingStronger")}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/70 bg-brand-900 px-8 py-8 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("actions.label")}</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("actions.movePipeline")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t("actions.movePipelineDesc")}</p>
                <Link
                  href={nextActionHref}
                  className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  {nextActionLabel}
                </Link>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("actions.currentRisk")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {stats.awaiting_analysis > 0 ? t("actions.riskUnanalyzed") : t("actions.riskReview")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("metrics.candidates")}
          value={stats.total_candidates.toString()}
          note={stats.total_candidates === 0 ? t("metrics.uploadToStart") : t("metrics.resumesReady")}
        />
        <MetricCard
          label={t("metrics.openJobs")}
          value={stats.total_jobs.toString()}
          note={stats.total_jobs === 0 ? t("metrics.addJob") : t("metrics.activeJobs")}
        />
        <MetricCard
          label={t("metrics.avgMatchScore")}
          value={stats.avg_match_score > 0 ? `${stats.avg_match_score.toFixed(1)}%` : "-"}
          note={t("metrics.averageFit")}
        />
        <MetricCard
          label={t("metrics.awaitingAnalysis")}
          value={stats.awaiting_analysis.toString()}
          note={t("metrics.waitingAnalysis")}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("pipelineOverview.label")}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("pipelineOverview.title")}</h2>
            </div>
            <Link href="/recruiter/candidates" className="text-sm font-semibold text-slate-700 hover:text-slate-950">
              {t("pipelineOverview.openCandidates")}
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">{t("pipelineOverview.applied")}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{stats.pipeline_counts.applied}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">{t("pipelineOverview.shortlisted")}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{stats.pipeline_counts.shortlisted}</p>
            </div>
            <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">{t("pipelineOverview.interview")}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{stats.pipeline_counts.interview}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">{t("pipelineOverview.rejected")}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{stats.pipeline_counts.rejected}</p>
            </div>
          </div>
        </Panel>

        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("topMatches.label")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("topMatches.title")}</h2>

          {stats.top_matches.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-900">{t("topMatches.empty")}</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{t("topMatches.emptyDesc")}</p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.top_matches.map((match) => (
                <li key={`${match.resume_id}-${match.job_id}`} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">{match.candidate_name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{match.job_title}</p>
                    </div>
                    <span className={`text-sm font-bold ${scoreClass(match.score)}`}>{match.score.toFixed(1)}%</span>
                  </div>
                  <div className="mt-3">
                    <ScoreBar score={match.score} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{t("recentCandidates.label")}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("recentCandidates.title")}</h2>
          </div>
          <Link href="/recruiter/candidates" className="text-sm font-semibold text-slate-700 hover:text-slate-950">
            {t("recentCandidates.openPipeline")}
          </Link>
        </div>

        {stats.recent_candidates.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-900">{t("recentCandidates.empty")}</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{t("recentCandidates.emptyDesc")}</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stats.recent_candidates.map((candidate) => (
              <div key={candidate.resume_id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950">{candidate.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{candidate.best_job ?? t("recentCandidates.noRankedJob")}</p>
                  </div>
                  <span className="text-xs text-slate-400">{formatDate(candidate.uploaded_at)}</span>
                </div>
                {candidate.best_score !== null ? (
                  <div className="mt-3">
                    <ScoreBar score={candidate.best_score} />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-amber-600">{t("recentCandidates.awaitingAnalysis")}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
