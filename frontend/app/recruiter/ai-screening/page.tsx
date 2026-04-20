"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Layers, SlidersHorizontal, FileText, ChevronDown, ArrowRight } from "lucide-react";

import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "new" | "shortlisted" | "interview" | "rejected";

type TalentFitRow = {
  resume_id: string;
  candidate_name: string;
  candidate_email: string | null;
  candidate_stage: Stage;
  job_id: string;
  job_title: string;
  job_location: string | null;
  overall_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
  hiring_suggestion: string | null;
  analyzed_at: string | null;
  report_id: string | null;
  report_status: string | null;
};

type TalentFitResponse = {
  rows: TalentFitRow[];
  total_candidates: number;
  total_jobs: number;
};

type JobOption = { id: string; title: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_LABELS_KEYS: Record<Stage, string> = {
  new: "stages.new",
  shortlisted: "stages.shortlisted",
  interview: "stages.interview",
  rejected: "stages.rejected",
};

const STAGE_CLS: Record<Stage, string> = {
  new:         "bg-sky-50 text-sky-700 border-sky-200",
  shortlisted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  interview:   "bg-violet-50 text-violet-700 border-violet-200",
  rejected:    "bg-rose-50 text-rose-700 border-rose-200",
};

const SUGGESTION_CLS: Record<string, string> = {
  shortlist:    "bg-emerald-100 text-emerald-700",
  interview:    "bg-violet-100 text-violet-700",
  needs_review: "bg-amber-100 text-amber-700",
  reject:       "bg-rose-100 text-rose-700",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) {
  if (s >= 70) return "text-emerald-700";
  if (s >= 40) return "text-amber-700";
  return "text-rose-600";
}

function scoreBg(s: number) {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function ScoreBar({ score }: { score: number }) {
  const c = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${scoreBg(c)}`} style={{ width: `${c}%` }} />
      </div>
      <span className={`text-xs font-bold tabular-nums ${scoreColor(c)}`}>{c.toFixed(1)}%</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TalentFitPage() {
  const t = useTranslations("recruiter.aiScreeningPage");
  const router = useRouter();
  const [data, setData] = useState<TalentFitResponse | null>(null);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [minScore, setMinScore] = useState(0);
  const [requesting, setRequesting] = useState<Set<string>>(new Set());

  useEffect(() => {
    api.get<JobOption[]>("/recruiter/talent-fit/jobs", { auth: true })
      .then(setJobs)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (selectedJob) params.set("job_id", selectedJob);
    if (minScore > 0) params.set("min_score", String(minScore));
    api.get<TalentFitResponse>(`/recruiter/talent-fit/?${params.toString()}`, { auth: true })
      .then(setData)
      .catch(() => setError(t("error")))
      .finally(() => setLoading(false));
  }, [selectedJob, minScore, t]);

  async function handleRequestReport(row: TalentFitRow) {
    const key = `${row.resume_id}-${row.job_id}`;
    if (requesting.has(key)) return;
    setRequesting((prev) => new Set(prev).add(key));
    try {
      const result = await api.post<{ id: string }>(
        "/recruiter/reports/",
        { resume_id: row.resume_id, job_id: row.job_id },
        { auth: true }
      );
      router.push(`/recruiter/reports/${result.id}`);
    } catch {
      setRequesting((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }
  }

  function handleViewReport(reportId: string) {
    router.push(`/recruiter/reports/${reportId}`);
  }

  const rows = data?.rows ?? [];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <Layers size={16} className="text-orange-500" />
          <p className="text-[15px] font-bold tracking-tight text-slate-900">{t("title")}</p>
          {data && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {t("candidatesJobs", { candidates: data.total_candidates, jobs: data.total_jobs })}
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Job filter */}
          <div className="relative">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">{t("allJobs")}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Min score filter */}
          <div className="relative">
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none focus:border-slate-400"
            >
              <option value={0}>{t("allScores")}</option>
              <option value={40}>≥ 40%</option>
              <option value={60}>≥ 60%</option>
              <option value={80}>≥ 80%</option>
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      {/* ── Filters summary ── */}
      {(selectedJob || minScore > 0) && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <SlidersHorizontal size={11} />
          <span>{t("filtersActive")}</span>
          <button
            type="button"
            onClick={() => { setSelectedJob(""); setMinScore(0); }}
            className="font-semibold text-slate-700 underline underline-offset-2"
          >
            {t("clearFilters")}
          </button>
        </div>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-14 text-center">
          <Layers size={24} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">{t("empty.title")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("empty.desc")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1fr_120px_90px_120px_auto] items-center gap-3 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            <span>{t("table.candidate")}</span>
            <span>{t("table.job")}</span>
            <span>{t("table.fitScore")}</span>
            <span>{t("table.stage")}</span>
            <span>{t("table.aiSuggestion")}</span>
            <span />
          </div>

          {/* Rows */}
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => {
              const key = `${row.resume_id}-${row.job_id}`;
              const isLoading = requesting.has(key);
              const hasReport = !!row.report_id && row.report_status !== "failed";
              const isPending = row.report_status === "pending";

              return (
                <li
                  key={key}
                  className="grid grid-cols-[1fr_1fr_120px_90px_120px_auto] items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                >
                  {/* Candidate */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{row.candidate_name}</p>
                    {row.candidate_email && (
                      <p className="truncate text-xs text-slate-400">{row.candidate_email}</p>
                    )}
                  </div>

                  {/* Job */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{row.job_title}</p>
                    {row.job_location && (
                      <p className="truncate text-xs text-slate-400">{row.job_location}</p>
                    )}
                  </div>

                  {/* Score */}
                  <ScoreBar score={row.overall_score} />

                  {/* Stage */}
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STAGE_CLS[row.candidate_stage]}`}>
                    {t(STAGE_LABELS_KEYS[row.candidate_stage])}
                  </span>

                  {/* Suggestion */}
                  <div>
                    {row.hiring_suggestion ? (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${SUGGESTION_CLS[row.hiring_suggestion] ?? "bg-slate-100 text-slate-600"}`}>
                        {row.hiring_suggestion.replace("_", " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="flex items-center justify-end gap-1.5">
                    {hasReport ? (
                      <button
                        type="button"
                        onClick={() => handleViewReport(row.report_id!)}
                        className="flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 transition hover:bg-teal-100"
                      >
                        <FileText size={11} />
                        {isPending ? t("table.generating") : t("table.viewReport")}
                        {!isPending && <ArrowRight size={10} />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => void handleRequestReport(row)}
                        className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                      >
                        {isLoading ? t("table.requesting") : t("table.requestReport")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
