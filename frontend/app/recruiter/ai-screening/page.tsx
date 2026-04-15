"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/panel";
import { api } from "@/lib/api";

type Job = {
  id: string;
  title: string;
  company_name: string | null;
};

type RankedCandidate = {
  resume_id: string;
  candidate_name: string;
  email: string | null;
  match_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
  hiring_suggestion: string | null;
  stage: string;
  analysis_id: string;
  analyzed_at: string | null;
};

type RankedResults = {
  job_id: string;
  job_title: string;
  candidates: RankedCandidate[];
};

type AutoShortlistResponse = {
  shortlisted: number;
  already_shortlisted: number;
  skipped: number;
};

function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-700";
  if (score >= 40) return "text-amber-700";
  return "text-rose-600";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function stageBadge(stage: string) {
  const map: Record<string, string> = {
    new: "bg-sky-100 text-sky-700",
    shortlisted: "bg-emerald-100 text-emerald-700",
    interview: "bg-violet-100 text-violet-700",
    rejected: "bg-rose-100 text-rose-700",
  };
  return map[stage] ?? "bg-slate-100 text-slate-600";
}

function suggestionLabel(s: string | null): string {
  if (!s) return "";
  const map: Record<string, string> = {
    shortlist: "Shortlist",
    interview: "Interview",
    needs_review: "Needs Review",
    reject: "Reject",
  };
  return map[s] ?? s;
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${scoreBg(clamped)}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`w-12 text-right text-xs font-bold tabular-nums ${scoreColor(clamped)}`}>
        {clamped.toFixed(1)}%
      </span>
    </div>
  );
}

export default function AIScreeningPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [minScore, setMinScore] = useState(0);
  const [results, setResults] = useState<RankedResults | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);
  const [shortlistResult, setShortlistResult] = useState<AutoShortlistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadJobs() {
      try {
        const data = await api.get<Job[]>("/recruiter/jobs/", { auth: true });
        setJobs(data);
        if (data.length > 0) setSelectedJobId(data[0].id);
      } catch {
        setError("Failed to load jobs.");
      } finally {
        setLoadingJobs(false);
      }
    }
    void loadJobs();
  }, []);

  async function runScreening() {
    if (!selectedJobId) return;
    setLoadingResults(true);
    setError(null);
    setShortlistResult(null);
    try {
      const data = await api.get<RankedResults>(
        `/recruiter/screening/ranked?job_id=${selectedJobId}&min_score=${minScore}`,
        { auth: true }
      );
      setResults(data);
    } catch {
      setError("Failed to load screening results.");
    } finally {
      setLoadingResults(false);
    }
  }

  async function runAutoShortlist() {
    if (!selectedJobId || !results) return;
    setShortlisting(true);
    setShortlistResult(null);
    try {
      const data = await api.post<AutoShortlistResponse>(
        "/recruiter/screening/auto-shortlist",
        { job_id: selectedJobId, min_score: minScore },
        { auth: true }
      );
      setShortlistResult(data);
      void runScreening();
    } catch {
      setError("Auto-shortlist failed. Please try again.");
    } finally {
      setShortlisting(false);
    }
  }

  if (loadingJobs) {
    return (
      <Panel className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="h-32 rounded bg-slate-100" />
        </div>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Panel className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Screening</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Rank candidates by job fit
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Select a job, set a minimum match score, and see every candidate ranked by AI analysis.
          Auto-shortlist promotes everyone above your threshold in one click.
        </p>

        {jobs.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-900">No jobs found</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Add at least one job before running screening.
            </p>
            <Link
              href="/recruiter/jobs"
              className="mt-4 inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Add a job
            </Link>
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1">
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Job</label>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  setSelectedJobId(e.target.value);
                  setResults(null);
                  setShortlistResult(null);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}{job.company_name ? ` — ${job.company_name}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Min Score: <span className="text-slate-900">{minScore}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={90}
                step={5}
                value={minScore}
                onChange={(e) => {
                  setMinScore(Number(e.target.value));
                  setResults(null);
                  setShortlistResult(null);
                }}
                className="w-40"
              />
            </div>

            <button
              type="button"
              onClick={() => void runScreening()}
              disabled={loadingResults || !selectedJobId}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {loadingResults ? "Running…" : "Run Screening"}
            </button>
          </div>
        )}
      </Panel>

      {error && (
        <Panel className="border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </Panel>
      )}

      {shortlistResult && (
        <Panel className="border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800">
            Auto-shortlist complete — {shortlistResult.shortlisted} promoted,{" "}
            {shortlistResult.already_shortlisted} already shortlisted,{" "}
            {shortlistResult.skipped} skipped.
          </p>
        </Panel>
      )}

      {/* Results */}
      {results && (
        <Panel className="p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Results</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                {results.job_title} —{" "}
                <span className="font-normal text-slate-600">{results.candidates.length} candidate{results.candidates.length !== 1 ? "s" : ""}</span>
              </h2>
            </div>

            {results.candidates.length > 0 && (
              <button
                type="button"
                onClick={() => void runAutoShortlist()}
                disabled={shortlisting}
                className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
              >
                {shortlisting
                  ? "Shortlisting…"
                  : `Auto-Shortlist ≥ ${minScore}%`}
              </button>
            )}
          </div>

          {results.candidates.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-900">No candidates above {minScore}%</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Lower the minimum score threshold or run candidate analysis first.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {results.candidates.map((candidate, index) => (
                <div
                  key={candidate.resume_id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-xs font-bold text-slate-700">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{candidate.candidate_name}</p>
                        {candidate.email && (
                          <p className="mt-0.5 text-xs text-slate-500">{candidate.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${stageBadge(candidate.stage)}`}>
                        {candidate.stage}
                      </span>
                      {candidate.hiring_suggestion && (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                          AI: {suggestionLabel(candidate.hiring_suggestion)}
                        </span>
                      )}
                      <Link
                        href={`/recruiter/candidates/${candidate.resume_id}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        View profile
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4">
                    <ScoreBar score={candidate.match_score} />
                  </div>

                  {(candidate.matching_keywords.length > 0 || candidate.missing_keywords.length > 0) && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {candidate.matching_keywords.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            Matching
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.matching_keywords.map((kw) => (
                              <span key={kw} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {candidate.missing_keywords.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-rose-600">
                            Missing
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {candidate.missing_keywords.map((kw) => (
                              <span key={kw} className="rounded-full bg-rose-50 px-2 py-0.5 text-xs text-rose-700">
                                {kw}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
