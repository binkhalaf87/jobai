"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Panel } from "@/components/panel";
import { ApiError } from "@/lib/api";
import {
  getSavedJobs,
  prefillAnalysisWithJob,
  saveJob,
  searchJobs,
  unsaveJobByExternalId,
} from "@/lib/jobs";
import { listResumes } from "@/lib/resumes";
import type { JobResult, ResumeListItem, SavedJob } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_OPTIONS = [
  { value: "all",    label: "Any time" },
  { value: "today",  label: "Today" },
  { value: "3days",  label: "Last 3 days" },
  { value: "week",   label: "Last week" },
  { value: "month",  label: "Last month" },
] as const;

const TYPE_OPTIONS = [
  { value: "",           label: "All types" },
  { value: "FULLTIME",   label: "Full-time" },
  { value: "PARTTIME",   label: "Part-time" },
  { value: "CONTRACTOR", label: "Contract" },
  { value: "INTERN",     label: "Internship" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSalary(min: number | null, max: number | null, currency: string | null): string | null {
  if (!min && !max) return null;
  const cur = currency ?? "SAR";
  if (min && max) return `${cur} ${min.toLocaleString()}–${max.toLocaleString()}`;
  if (min) return `${cur} ${min.toLocaleString()}+`;
  if (max) return `Up to ${cur} ${max.toLocaleString()}`;
  return null;
}

function FitBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const pct = Math.round(score);
  const cfg =
    pct >= 70 ? { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", label: "Great fit" } :
    pct >= 45 ? { bg: "bg-amber-50 border-amber-200 text-amber-700",       label: "Partial fit" } :
                { bg: "bg-rose-50 border-rose-200 text-rose-700",          label: "Low fit" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.bg}`}>
      <span>{pct}%</span>
      <span className="opacity-60">match</span>
    </span>
  );
}

function EmploymentBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
      {type}
    </span>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  onSave,
  onUnsave,
  onAnalyze,
  savingId,
}: {
  job: JobResult;
  onSave: (job: JobResult) => void;
  onUnsave: (jobId: string) => void;
  onAnalyze: (job: JobResult) => void;
  savingId: string | null;
}) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const isBusy = savingId === job.job_id;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{job.job_title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{job.company_name}</p>
        </div>
        {/* Company logo */}
        {job.employer_logo ? (
          <img
            src={job.employer_logo}
            alt={job.company_name}
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 object-contain p-1"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400">
            {job.company_name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            {job.location}
          </span>
        )}
        {job.location && job.employment_type && <span>·</span>}
        <EmploymentBadge type={job.employment_type} />
      </div>

      {/* Salary + fit score */}
      <div className="flex flex-wrap items-center gap-2">
        {salary && (
          <span className="text-xs font-medium text-slate-600">{salary}</span>
        )}
        <FitBadge score={job.fit_score} />
      </div>

      {/* Source */}
      {job.source && (
        <p className="text-[10px] text-slate-400">via {job.source}</p>
      )}

      {/* Actions */}
      <div className="mt-auto flex items-center gap-2 pt-1">
        {/* Save / Unsave */}
        <button
          type="button"
          disabled={isBusy}
          onClick={() => job.is_saved ? onUnsave(job.job_id) : onSave(job)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            job.is_saved
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
          }`}
        >
          <span>{job.is_saved ? "★" : "☆"}</span>
          {job.is_saved ? "Saved" : "Save"}
        </button>

        {/* Analyze */}
        {job.job_description && (
          <button
            type="button"
            onClick={() => onAnalyze(job)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Analyze
          </button>
        )}

        {/* Apply */}
        {job.apply_link && (
          <a
            href={job.apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Apply
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Saved job card ───────────────────────────────────────────────────────────

function SavedJobCard({
  job,
  onRemove,
  onAnalyze,
  removing,
}: {
  job: SavedJob;
  onRemove: (id: string) => void;
  onAnalyze: (job: SavedJob) => void;
  removing: string | null;
}) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{job.job_title}</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{job.company_name}</p>
        </div>
        {job.employer_logo ? (
          <img
            src={job.employer_logo}
            alt={job.company_name}
            className="h-9 w-9 shrink-0 rounded-lg border border-slate-100 object-contain p-1"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400">
            {job.company_name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        {job.location && <span>{job.location}</span>}
        {job.location && job.employment_type && <span>·</span>}
        <EmploymentBadge type={job.employment_type} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {salary && <span className="text-xs font-medium text-slate-600">{salary}</span>}
        <FitBadge score={job.fit_score} />
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={removing === job.job_id}
          onClick={() => onRemove(job.job_id)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:opacity-50"
        >
          Remove
        </button>

        {job.job_description && (
          <button
            type="button"
            onClick={() => onAnalyze(job)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Analyze
          </button>
        )}

        {job.apply_link && (
          <a
            href={job.apply_link}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Apply
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type PageState = "idle" | "searching" | "results" | "error";
type ActiveTab = "search" | "saved";

export default function DashboardJobSearchPage() {
  const router = useRouter();

  // ── Search form ────────────────────────────────────────────────────────────
  const [query, setQuery]               = useState("");
  const [location, setLocation]         = useState("");
  const [datePosted, setDatePosted]     = useState<typeof DATE_OPTIONS[number]["value"]>("all");
  const [employmentType, setType]       = useState("");
  const [resumeId, setResumeId]         = useState("");
  const [resumes, setResumes]           = useState<ResumeListItem[]>([]);

  // ── Results ────────────────────────────────────────────────────────────────
  const [pageState, setPageState]       = useState<PageState>("idle");
  const [searchError, setSearchError]   = useState("");
  const [results, setResults]           = useState<JobResult[]>([]);
  const [totalFound, setTotalFound]     = useState(0);
  const [currentPage, setCurrentPage]   = useState(1);
  const [lastQuery, setLastQuery]       = useState<{ q: string; loc: string } | null>(null);

  // ── Saved jobs ─────────────────────────────────────────────────────────────
  const [savedJobs, setSavedJobs]       = useState<SavedJob[]>([]);
  const [savingId, setSavingId]         = useState<string | null>(null);
  const [removingId, setRemovingId]     = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<ActiveTab>("search");

  const resultsRef = useRef<HTMLDivElement>(null);

  // Load resumes + saved jobs on mount
  const loadInitialData = useCallback(async () => {
    const [resumeList, saved] = await Promise.all([
      listResumes().catch(() => [] as ResumeListItem[]),
      getSavedJobs().catch(() => [] as SavedJob[]),
    ]);
    setResumes(resumeList);
    setSavedJobs(saved);
    if (resumeList.length > 0) setResumeId(resumeList[0].id);
  }, []);

  useEffect(() => { void loadInitialData(); }, [loadInitialData]);

  // ── Search ─────────────────────────────────────────────────────────────────

  async function handleSearch(page = 1) {
    if (!query.trim()) return;
    setPageState("searching");
    setSearchError("");
    if (page === 1) setResults([]);

    try {
      const res = await searchJobs({
        q: query.trim(),
        location: location.trim() || undefined,
        page,
        date_posted: datePosted,
        employment_type: employmentType || undefined,
        resume_id: resumeId || undefined,
      });

      // Mark saved status against current saved jobs
      const savedExternalIds = new Set(savedJobs.map((s) => s.job_id));
      const marked = res.results.map((j) => ({ ...j, is_saved: savedExternalIds.has(j.job_id) }));

      if (page === 1) {
        setResults(marked);
      } else {
        setResults((prev) => [...prev, ...marked]);
      }
      setTotalFound(res.total_found);
      setCurrentPage(page);
      setLastQuery({ q: query.trim(), loc: location.trim() });
      setPageState("results");

      if (page === 1) {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? e.detail : "Search failed. Please try again.";
      setSearchError(msg);
      setPageState("error");
    }
  }

  async function handleLoadMore() {
    await handleSearch(currentPage + 1);
  }

  // ── Save / Unsave ──────────────────────────────────────────────────────────

  async function handleSave(job: JobResult) {
    setSavingId(job.job_id);
    try {
      const saved = await saveJob(job);
      setSavedJobs((prev) => [saved, ...prev]);
      setResults((prev) =>
        prev.map((j) => (j.job_id === job.job_id ? { ...j, is_saved: true } : j))
      );
    } catch {
      // silent
    } finally {
      setSavingId(null);
    }
  }

  async function handleUnsave(jobId: string) {
    setSavingId(jobId);
    try {
      await unsaveJobByExternalId(jobId);
      setSavedJobs((prev) => prev.filter((s) => s.job_id !== jobId));
      setResults((prev) =>
        prev.map((j) => (j.job_id === jobId ? { ...j, is_saved: false } : j))
      );
    } catch {
      // silent
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemoveSaved(jobId: string) {
    setRemovingId(jobId);
    try {
      await unsaveJobByExternalId(jobId);
      setSavedJobs((prev) => prev.filter((s) => s.job_id !== jobId));
      setResults((prev) =>
        prev.map((j) => (j.job_id === jobId ? { ...j, is_saved: false } : j))
      );
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  }

  // ── Analyze ────────────────────────────────────────────────────────────────

  function handleAnalyze(job: { job_title: string; job_description: string | null }) {
    if (!job.job_description) return;
    prefillAnalysisWithJob(job.job_title, job.job_description);
    router.push("/dashboard/analysis");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const canSearch = query.trim().length > 0 && pageState !== "searching";
  const hasMore = results.length > 0 && results.length < totalFound;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Tools</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Job Search</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search millions of real job listings, see your AI fit score, and analyze any role in one click.
        </p>
      </div>

      {/* Search card */}
      <Panel className="p-5 md:p-6">
        {/* Main search row */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Query */}
          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canSearch) void handleSearch(1); }}
              placeholder="Job title, role, or keywords…"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {/* Location */}
          <div className="relative sm:w-52">
            <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canSearch) void handleSearch(1); }}
              placeholder="City or country"
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={!canSearch}
            onClick={() => void handleSearch(1)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {pageState === "searching" ? (
              <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Searching…</>
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Filter row */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* Date posted */}
          <select
            value={datePosted}
            onChange={(e) => setDatePosted(e.target.value as typeof datePosted)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            {DATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Employment type */}
          <select
            value={employmentType}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Resume selector for fit score */}
          {resumes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Score against:</span>
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="">— no scoring —</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.source_filename ?? r.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Panel>

      {/* Tabs: Results / Saved */}
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 w-fit">
        {(["search", "saved"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "search" ? (
              <>Search Results {results.length > 0 && <span className="ml-1 text-slate-400">({results.length})</span>}</>
            ) : (
              <>Saved <span className="ml-1 text-slate-400">({savedJobs.length})</span></>
            )}
          </button>
        ))}
      </div>

      {/* ── Search Results tab ───────────────────────────────────────── */}
      {activeTab === "search" && (
        <div ref={resultsRef} className="space-y-4">
          {/* Error */}
          {pageState === "error" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {searchError}
            </div>
          )}

          {/* Idle / empty state */}
          {pageState === "idle" && (
            <Panel className="px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900">Search for jobs</p>
              <p className="mt-1 text-xs text-slate-500">
                Enter a job title above. Select your resume to see AI fit scores alongside each result.
              </p>
            </Panel>
          )}

          {/* Searching skeleton */}
          {pageState === "searching" && currentPage === 1 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
              ))}
            </div>
          )}

          {/* Results grid */}
          {(pageState === "results" || (pageState === "searching" && currentPage > 1)) && results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{results.length}</span> of{" "}
                  <span className="font-semibold text-slate-700">{totalFound.toLocaleString()}</span> results
                  {lastQuery && (
                    <> for <span className="font-medium text-slate-700">"{lastQuery.q}"</span>
                    {lastQuery.loc && <> in <span className="font-medium text-slate-700">{lastQuery.loc}</span></>}
                    </>
                  )}
                </p>
                {resumeId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    AI Fit Score active
                  </span>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                    onAnalyze={handleAnalyze}
                    savingId={savingId}
                  />
                ))}
                {pageState === "searching" && currentPage > 1 && (
                  Array.from({ length: 3 }, (_, i) => (
                    <div key={`skel-${i}`} className="h-44 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
                  ))
                )}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void handleLoadMore()}
                    disabled={pageState === "searching"}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-50"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}

          {/* No results */}
          {pageState === "results" && results.length === 0 && (
            <Panel className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">No results found</p>
              <p className="mt-1 text-xs text-slate-500">Try a broader search term or different location.</p>
            </Panel>
          )}
        </div>
      )}

      {/* ── Saved Jobs tab ────────────────────────────────────────────── */}
      {activeTab === "saved" && (
        <div className="space-y-4">
          {savedJobs.length === 0 ? (
            <Panel className="px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl text-slate-300">
                ☆
              </div>
              <p className="text-sm font-semibold text-slate-900">No saved jobs yet</p>
              <p className="mt-1 text-xs text-slate-500">
                Star any job in the search results to save it here.
              </p>
            </Panel>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{savedJobs.length}</span> saved job{savedJobs.length !== 1 ? "s" : ""}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {savedJobs.map((job) => (
                  <SavedJobCard
                    key={job.id}
                    job={job}
                    onRemove={handleRemoveSaved}
                    onAnalyze={handleAnalyze}
                    removing={removingId}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
