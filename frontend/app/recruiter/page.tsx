"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { Panel } from "@/components/panel";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  top_matches: TopMatch[];
  recent_candidates: RecentCandidate[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number | null, suffix = ""): string {
  if (value === null) return "—";
  return `${value.toLocaleString("en-US")}${suffix}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function scoreTextColor(score: number): string {
  if (score >= 70) return "text-emerald-700";
  if (score >= 40) return "text-amber-700";
  return "text-rose-600";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
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
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>
    </Panel>
  );
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span
        className={`w-12 text-left text-xs font-semibold tabular-nums ${scoreTextColor(clamped)}`}
      >
        {clamped.toFixed(1)}%
      </span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Panel key={i} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-8 w-16 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
            </div>
          </Panel>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Panel key={i} className="p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="h-6 w-48 rounded bg-slate-200" />
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="h-14 rounded-2xl bg-slate-100" />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.get<DashboardStats>(
          "/recruiter/dashboard/stats",
          { auth: true },
        );
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error || !stats) {
    return (
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Dashboard
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          {error ?? "No data available"}
        </h1>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setLoading(true);
            setStats(null);
          }}
          className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Retry
        </button>
      </Panel>
    );
  }

  const topScore = stats.top_matches[0]?.score ?? null;

  return (
    <div className="space-y-6">
      {/* ─── Hero banner ───────────────────────────────────────── */}
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Recruiter Dashboard
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Welcome to your hiring workspace
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
          You currently have{" "}
          <span className="font-semibold text-slate-900">
            {stats.total_candidates} candidate{stats.total_candidates !== 1 ? "s" : ""}
          </span>{" "}
          and{" "}
          <span className="font-semibold text-slate-900">
            {stats.total_jobs} job{stats.total_jobs !== 1 ? "s" : ""}
          </span>{" "}
          in your account.
        </p>
      </Panel>

      {/* ─── Stat cards ────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Candidates"
          value={fmt(stats.total_candidates)}
          note={
            stats.total_candidates === 0
              ? "No resumes uploaded yet."
              : "Total resumes uploaded to your workspace."
          }
        />
        <StatCard
          label="Total Jobs"
          value={fmt(stats.total_jobs)}
          note={
            stats.total_jobs === 0
              ? "No jobs posted yet."
              : "Active job postings in your account."
          }
        />
        <StatCard
          label="Avg. Match Score"
          value={
            stats.avg_match_score > 0
              ? `${stats.avg_match_score.toFixed(1)}%`
              : "—"
          }
          note="Average across all completed match analyses."
        />
        <StatCard
          label="Top Match"
          value={topScore !== null ? `${topScore.toFixed(1)}%` : "—"}
          note={
            stats.top_matches[0]
              ? `${stats.top_matches[0].candidate_name} — ${stats.top_matches[0].job_title}`
              : "No completed analyses yet."
          }
        />
      </div>

      {/* ─── Two-column panels ─────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Top matches */}
        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Top Matches
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Top 5 candidate–job pairs by score
          </h2>

          {stats.top_matches.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-900">
                No matches yet
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Upload resumes and run analyses against jobs to see results here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.top_matches.map((match, i) => (
                <li
                  key={`${match.resume_id}-${match.job_id}`}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {match.candidate_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {match.job_title}
                      </p>
                    </div>
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600">
                      {i + 1}
                    </span>
                  </div>
                  <div className="mt-3">
                    <ScoreBar score={match.score} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Recent candidates */}
        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Recent Candidates
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Last 5 resumes uploaded
          </h2>

          {stats.recent_candidates.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-900">
                No candidates yet
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Upload candidate resumes from the Candidates page.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {stats.recent_candidates.map((candidate) => (
                <li
                  key={candidate.resume_id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {candidate.title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {candidate.best_job ?? "No match yet"}
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-xs text-slate-400">
                      {fmtDate(candidate.uploaded_at)}
                    </span>
                  </div>

                  {candidate.best_score !== null ? (
                    <div className="mt-3">
                      <ScoreBar score={candidate.best_score} />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Pending analysis
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
