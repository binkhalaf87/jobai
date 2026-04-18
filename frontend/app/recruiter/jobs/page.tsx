"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { Panel } from "@/components/panel";

// ─── Types ────────────────────────────────────────────────────────────────────

type EmploymentType =
  | "full_time"
  | "part_time"
  | "contract"
  | "internship"
  | "temporary";

type JobListItem = {
  id: string;
  title: string;
  company_name: string | null;
  location: string | null;
  employment_type: EmploymentType | null;
  created_at: string;
  candidate_count: number;
};

type RankedCandidate = {
  resume_id: string;
  candidate_name: string;
  email: string | null;
  match_score: number;
  hiring_suggestion: string | null;
  stage: string;
  analysis_id: string;
};

type RankedResults = {
  job_id: string;
  job_title: string;
  candidates: RankedCandidate[];
};

type CreateJobForm = {
  title: string;
  company_name: string;
  description: string;
  location: string;
  employment_type: EmploymentType | "";
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateJobForm = {
  title: "",
  company_name: "",
  description: "",
  location: "",
  employment_type: "",
};

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  temporary: "Temporary",
};

const EMPLOYMENT_TYPE_COLORS: Record<EmploymentType, string> = {
  full_time: "bg-sky-50 text-sky-700 border-sky-200",
  part_time: "bg-violet-50 text-violet-700 border-violet-200",
  contract: "bg-amber-50 text-amber-700 border-amber-200",
  internship: "bg-emerald-50 text-emerald-700 border-emerald-200",
  temporary: "bg-rose-50 text-rose-700 border-rose-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scoreColor(s: number): string {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function scoreText(s: number): string {
  if (s >= 70) return "text-emerald-700";
  if (s >= 40) return "text-amber-700";
  return "text-rose-600";
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const c = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${scoreColor(c)}`}
          style={{ width: `${c}%` }}
        />
      </div>
      <span
        className={`w-12 text-left text-xs font-semibold tabular-nums ${scoreText(c)}`}
      >
        {c.toFixed(1)}%
      </span>
    </div>
  );
}

function EmploymentBadge({ type }: { type: EmploymentType }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${EMPLOYMENT_TYPE_COLORS[type]}`}
    >
      {EMPLOYMENT_TYPE_LABELS[type]}
    </span>
  );
}

// ─── Add job form ─────────────────────────────────────────────────────────────

function AddJobForm({
  onSave,
  onCancel,
}: {
  onSave: (job: JobListItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateJobForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof CreateJobForm>(key: K, val: CreateJobForm[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: Record<string, string | undefined> = {
        title: form.title.trim(),
        description: form.description.trim(),
      };
      if (form.company_name.trim()) payload.company_name = form.company_name.trim();
      if (form.location.trim()) payload.location = form.location.trim();
      if (form.employment_type) payload.employment_type = form.employment_type;

      const created = await api.post<JobListItem>(
        "/recruiter/jobs/",
        payload,
        { auth: true },
      );
      onSave(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Job Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-800 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Company */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Company Name
          </label>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => set("company_name", e.target.value)}
            placeholder="Optional"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-800 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Location
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. New York, USA"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-800 focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Employment type */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Employment Type
          </label>
          <select
            value={form.employment_type}
            onChange={(e) =>
              set("employment_type", e.target.value as EmploymentType | "")
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-800 focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">— Select —</option>
            {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
              ([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700">
          Job Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={5}
          placeholder="Enter job requirements, required skills, and responsibilities…"
          className="resize-y rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-800 focus:ring-2 focus:ring-slate-900/10"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save job"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Ranked candidate row ─────────────────────────────────────────────────────

const SUGGESTION_CONFIG: Record<string, { label: string; color: string }> = {
  shortlist:    { label: "Shortlist",    color: "bg-emerald-100 text-emerald-700" },
  interview:    { label: "Interview",    color: "bg-violet-100 text-violet-700"   },
  needs_review: { label: "Review",       color: "bg-amber-100 text-amber-700"     },
  reject:       { label: "Reject",       color: "bg-rose-100 text-rose-600"       },
};

const STAGE_COLORS_MAP: Record<string, string> = {
  new:         "bg-sky-100 text-sky-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  interview:   "bg-violet-100 text-violet-700",
  rejected:    "bg-rose-100 text-rose-500",
};

function RankedRow({ candidate, rank }: { candidate: RankedCandidate; rank: number }) {
  const suggestion = candidate.hiring_suggestion ? SUGGESTION_CONFIG[candidate.hiring_suggestion] : null;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-slate-200 text-[10px] font-bold text-slate-600">
        #{rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[13px] font-semibold text-slate-900">{candidate.candidate_name}</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_COLORS_MAP[candidate.stage] ?? "bg-slate-100 text-slate-600"}`}>
            {candidate.stage}
          </span>
          {suggestion && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${suggestion.color}`}>
              AI: {suggestion.label}
            </span>
          )}
        </div>
        <div className="mt-1.5">
          <ScoreBar score={candidate.match_score} />
        </div>
      </div>
      <Link
        href={`/recruiter/candidates/${candidate.resume_id}`}
        className="flex-shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
      >
        View
      </Link>
    </li>
  );
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({
  job,
  isExpanded,
  ranked,
  loadingRanked,
  shortlisting,
  shortlistResult,
  confirmDelete,
  deleting,
  onToggle,
  onAutoShortlist,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
}: {
  job: JobListItem;
  isExpanded: boolean;
  ranked: RankedResults | undefined;
  loadingRanked: boolean;
  shortlisting: boolean;
  shortlistResult: string | null;
  confirmDelete: boolean;
  deleting: boolean;
  onToggle: () => void;
  onAutoShortlist: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const topScore = ranked?.candidates[0]?.match_score ?? null;

  return (
    <li className="rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300">
      {/* Card header */}
      <div className="flex cursor-pointer items-start gap-4 p-5" onClick={onToggle}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-slate-950">{job.title}</p>
            {job.employment_type && <EmploymentBadge type={job.employment_type} />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {job.company_name && <span>{job.company_name}</span>}
            {job.location && <><span>·</span><span>{job.location}</span></>}
            <span>·</span>
            <span><span className="font-semibold text-slate-700">{job.candidate_count}</span> candidate{job.candidate_count !== 1 ? "s" : ""}</span>
            {topScore !== null && (
              <><span>·</span><span>Top: <span className={`font-semibold ${scoreText(topScore)}`}>{topScore.toFixed(0)}%</span></span></>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
          {!confirmDelete ? (
            <button type="button" onClick={onConfirmDelete}
              className="rounded-lg px-3 py-1 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
              Delete
            </button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={onDelete} disabled={deleting}
                className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                {deleting ? "…" : "Confirm"}
              </button>
              <button type="button" onClick={onCancelDelete}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
            </div>
          )}
          <span className="text-[11px] text-slate-400">{isExpanded ? "▲ Hide" : "▼ View candidates"}</span>
        </div>
      </div>

      {/* Expanded ranked candidates */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-3">
          {loadingRanked ? (
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100" />)}
            </div>
          ) : !ranked ? (
            <p className="text-sm text-slate-500">Failed to load candidates.</p>
          ) : ranked.candidates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-sm font-semibold text-slate-700">No analyzed candidates yet</p>
              <p className="mt-1 text-xs text-slate-400">Run AI analysis from the Candidates page first.</p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {ranked.candidates.map((c, i) => (
                  <RankedRow key={c.resume_id} candidate={c} rank={i + 1} />
                ))}
              </ul>

              {/* Auto-shortlist */}
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-[12px] font-semibold text-slate-700">Auto-Shortlist</p>
                  <p className="text-[11px] text-slate-400">Promote all candidates scoring ≥ 70%</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onAutoShortlist(); }}
                  disabled={shortlisting}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {shortlisting ? "Shortlisting…" : "Run"}
                </button>
              </div>

              {shortlistResult && (
                <p className={`rounded-lg px-3 py-2 text-xs font-medium ${
                  shortlistResult.startsWith("✦") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
                }`}>{shortlistResult}</p>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [ranked, setRanked] = useState<Record<string, RankedResults>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingRankedId, setLoadingRankedId] = useState<string | null>(null);

  const [shortlistingId, setShortlistingId] = useState<string | null>(null);
  const [shortlistResults, setShortlistResults] = useState<Record<string, string>>({});

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api.get<JobListItem[]>("/recruiter/jobs/", { auth: true });
        if (!cancelled) setJobs(data);
      } catch {
        if (!cancelled) setListError("Failed to load jobs.");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  function handleJobSaved(job: JobListItem) {
    setJobs((prev) => [job, ...prev]);
    setShowForm(false);
  }

  async function handleToggle(id: string) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (ranked[id]) return;
    setLoadingRankedId(id);
    try {
      const data = await api.get<RankedResults>(`/recruiter/screening/ranked?job_id=${id}&min_score=0`, { auth: true });
      setRanked((prev) => ({ ...prev, [id]: data }));
    } catch {/* ranked stays undefined */} finally {
      setLoadingRankedId(null);
    }
  }

  async function handleAutoShortlist(id: string) {
    setShortlistingId(id);
    try {
      const res = await api.post<{ shortlisted: number; already_shortlisted: number; skipped: number }>(
        "/recruiter/screening/auto-shortlist", { job_id: id, min_score: 70 }, { auth: true }
      );
      setShortlistResults((prev) => ({
        ...prev,
        [id]: `✦ ${res.shortlisted} promoted, ${res.already_shortlisted} already shortlisted, ${res.skipped} skipped.`,
      }));
      // Refresh ranked results
      setRanked((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setLoadingRankedId(id);
      const fresh = await api.get<RankedResults>(`/recruiter/screening/ranked?job_id=${id}&min_score=0`, { auth: true });
      setRanked((prev) => ({ ...prev, [id]: fresh }));
    } catch {
      setShortlistResults((prev) => ({ ...prev, [id]: "Auto-shortlist failed. Try again." }));
    } finally {
      setShortlistingId(null);
      setLoadingRankedId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/recruiter/jobs/${id}`, undefined, { auth: true });
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setRanked((prev) => { const next = { ...prev }; delete next[id]; return next; });
      if (expandedId === id) setExpandedId(null);
    } catch {/* leave in list */} finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header + form */}
      <Panel className="p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <p className="text-[15px] font-bold tracking-tight text-slate-900">Job Listings</p>
            {jobs.length > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{jobs.length}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              showForm ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-brand-800 text-white hover:bg-brand-700"
            }`}
          >
            {showForm ? "Cancel" : "+ Add job"}
          </button>
        </div>
        {showForm && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <AddJobForm onSave={handleJobSaved} onCancel={() => setShowForm(false)} />
          </div>
        )}
      </Panel>

      {/* Jobs list */}
      {listLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : listError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{listError}</div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <p className="text-sm font-semibold text-slate-700">No jobs yet</p>
          <p className="mt-1 text-xs text-slate-400">Add a job above to start matching candidates.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isExpanded={expandedId === job.id}
              ranked={ranked[job.id]}
              loadingRanked={loadingRankedId === job.id}
              shortlisting={shortlistingId === job.id}
              shortlistResult={shortlistResults[job.id] ?? null}
              confirmDelete={confirmDeleteId === job.id}
              deleting={deletingId === job.id}
              onToggle={() => void handleToggle(job.id)}
              onAutoShortlist={() => void handleAutoShortlist(job.id)}
              onConfirmDelete={() => setConfirmDeleteId(job.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onDelete={() => void handleDelete(job.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
