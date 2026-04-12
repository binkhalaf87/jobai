"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { api, uploadRequest } from "@/lib/api";
import { Panel } from "@/components/panel";

// ─── Types ────────────────────────────────────────────────────────────────────

type CandidateListItem = {
  id: string;
  title: string;
  created_at: string;
  best_match_job: string | null;
  best_match_score: number | null;
  status: string;
};

type JobMatch = {
  job_id: string;
  job_title: string;
  overall_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
};

type TopRecommendation = {
  job_title: string;
  reason: string;
};

type CandidateDetail = {
  id: string;
  title: string;
  created_at: string;
  skills: string[];
  matches: JobMatch[];
  top_recommendation: TopRecommendation | null;
};

type FileUploadItem = {
  uid: string;
  name: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

// ─── Accepted file types ──────────────────────────────────────────────────────

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function isAccepted(file: File): boolean {
  return (
    ACCEPTED_MIME.has(file.type) ||
    file.name.toLowerCase().endsWith(".pdf") ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function uid() {
  return Math.random().toString(36).slice(2);
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

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFilesAdded,
}: {
  onFilesAdded: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function collect(fileList: FileList | null) {
    if (!fileList) return;
    const valid = Array.from(fileList).filter(isAccepted);
    if (valid.length) onFilesAdded(valid);
  }

  return (
    <Panel className="p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Resume Upload
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Upload candidate resumes
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Select multiple files at once. Supported formats: PDF and DOCX.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-shrink-0 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
        >
          Choose files
        </button>
      </div>

      <div
        onDragEnter={() => setDragging(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          collect(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`mt-6 cursor-pointer rounded-3xl border border-dashed px-6 py-10 text-center transition ${
          dragging
            ? "border-slate-900 bg-slate-100"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          multiple
          className="hidden"
          onChange={(e) => {
            collect(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <p className="text-base font-semibold text-slate-900">
          Drag and drop files here
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Or click to browse — PDF and DOCX supported
        </p>
      </div>
    </Panel>
  );
}

// ─── Upload queue ─────────────────────────────────────────────────────────────

function UploadQueue({ items }: { items: FileUploadItem[] }) {
  if (items.length === 0) return null;

  return (
    <Panel className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        Upload Queue
      </p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.uid}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-slate-800">
                {item.name}
              </span>
              <span className="flex-shrink-0 text-xs font-semibold tabular-nums text-slate-500">
                {item.status === "done"
                  ? "✓"
                  : item.status === "error"
                    ? "✗"
                    : `${item.progress}%`}
              </span>
            </div>

            {item.status !== "done" && item.status !== "error" && (
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}

            {item.status === "done" && (
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-emerald-100">
                <div className="h-full w-full rounded-full bg-emerald-500" />
              </div>
            )}

            {item.status === "error" && (
              <p className="mt-1 text-xs text-rose-600">{item.error}</p>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ─── Candidate detail panel ───────────────────────────────────────────────────

function CandidateDetailPanel({ detail }: { detail: CandidateDetail }) {
  const bestMatch = detail.matches[0] ?? null;
  const matchingSet = new Set(
    (bestMatch?.matching_keywords ?? []).map((k) => k.toLowerCase()),
  );
  const missingSet = new Set(
    (bestMatch?.missing_keywords ?? []).map((k) => k.toLowerCase()),
  );

  function skillClass(skill: string): string {
    const key = skill.toLowerCase();
    if (matchingSet.has(key))
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (missingSet.has(key))
      return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  }

  return (
    <div className="space-y-5 pb-2 pt-4">
      {/* Recommendation box */}
      {detail.top_recommendation && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Top Recommendation
          </p>
          <p className="mt-1.5 text-sm font-semibold text-emerald-900">
            Best fit for {detail.top_recommendation.job_title}
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            {detail.top_recommendation.reason}
          </p>
        </div>
      )}

      {/* Skills */}
      {detail.skills.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Extracted Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {detail.skills.map((skill) => (
              <span
                key={skill}
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${skillClass(skill)}`}
              >
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Green = matched · Amber = missing · Gray = unclassified
          </p>
        </div>
      )}

      {/* Job matches */}
      {detail.matches.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Job Match Scores
          </p>
          <ul className="space-y-2">
            {detail.matches.map((match) => (
              <li
                key={match.job_id}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {match.job_title}
                  </p>
                  <span
                    className={`text-xs font-bold tabular-nums ${scoreText(match.overall_score)}`}
                  >
                    {match.overall_score.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2">
                  <ScoreBar score={match.overall_score} />
                </div>
                {match.matching_keywords.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    <span className="font-semibold text-emerald-700">
                      Matched:
                    </span>{" "}
                    {match.matching_keywords.slice(0, 5).join(", ")}
                    {match.matching_keywords.length > 5 &&
                      ` +${match.matching_keywords.length - 5}`}
                  </p>
                )}
                {match.missing_keywords.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    <span className="font-semibold text-amber-700">
                      Missing:
                    </span>{" "}
                    {match.missing_keywords.slice(0, 5).join(", ")}
                    {match.missing_keywords.length > 5 &&
                      ` +${match.missing_keywords.length - 5}`}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {detail.matches.length === 0 && (
        <p className="text-sm text-slate-500">
          No jobs to compare against. Add jobs from the Jobs page first.
        </p>
      )}
    </div>
  );
}

// ─── Candidate row ────────────────────────────────────────────────────────────

function CandidateRow({
  candidate,
  isExpanded,
  detail,
  loadingDetail,
  confirmDelete,
  deleting,
  onToggle,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  candidate: CandidateListItem;
  isExpanded: boolean;
  detail: CandidateDetail | undefined;
  loadingDetail: boolean;
  confirmDelete: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  return (
    <li className="rounded-3xl border border-slate-200 bg-white transition hover:border-slate-300">
      {/* Row header */}
      <div
        className="flex cursor-pointer items-start gap-4 p-5"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-950">
              {candidate.title}
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {candidate.status}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {candidate.best_match_job ?? "No matching job yet"}
          </p>
          {candidate.best_match_score !== null && (
            <div className="mt-2 max-w-xs">
              <ScoreBar score={candidate.best_match_score} />
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-2">
          <span className="text-xs text-slate-400">
            {fmtDate(candidate.created_at)}
          </span>

          {/* Delete / confirm */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={onConfirmDelete}
                className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                Delete
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                  type="button"
                  onClick={onCancelDelete}
                  className="rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          <span className="text-xs text-slate-400">
            {isExpanded ? "▲ Hide" : "▼ Details"}
          </span>
        </div>
      </div>

      {/* Inline detail panel */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-5">
          {loadingDetail ? (
            <div className="animate-pulse space-y-3 py-5">
              <div className="h-16 rounded-2xl bg-slate-100" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-7 w-20 rounded-full bg-slate-100" />
                ))}
              </div>
              <div className="h-24 rounded-2xl bg-slate-100" />
            </div>
          ) : detail ? (
            <CandidateDetailPanel detail={detail} />
          ) : (
            <p className="py-4 text-sm text-slate-500">
              Failed to load details.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const uploadingRef = useRef(false);

  const [details, setDetails] = useState<Record<string, CandidateDetail>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // --- Load candidates list ---

  async function loadCandidates() {
    try {
      const data = await api.get<CandidateListItem[]>(
        "/recruiter/candidates/",
        { auth: true },
      );
      setCandidates(data);
    } catch {
      setListError("Failed to load candidates.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    void loadCandidates();
  }, []);

  // --- Upload queue processing ---

  function updateItem(itemUid: string, patch: Partial<FileUploadItem>) {
    setUploadQueue((prev) =>
      prev.map((item) => (item.uid === itemUid ? { ...item, ...patch } : item)),
    );
  }

  const processQueue = useCallback(async (queue: FileUploadItem[]) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    for (const item of queue) {
      if (item.status !== "pending") continue;

      updateItem(item.uid, { status: "uploading", progress: 0 });

      const formData = new FormData();
      formData.append("files", item.file);

      try {
        await uploadRequest<{ resume_ids: string[] }>(
          "/recruiter/candidates/upload",
          formData,
          {
            auth: true,
            onProgress: (p) => updateItem(item.uid, { progress: p }),
          },
        );
        updateItem(item.uid, { status: "done", progress: 100 });
      } catch (err) {
        updateItem(item.uid, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed. Please try again.",
        });
      }
    }

    uploadingRef.current = false;

    // Refresh list after all uploads
    setListLoading(true);
    void loadCandidates();
  }, []);

  function handleFilesAdded(files: File[]) {
    const newItems: FileUploadItem[] = files.map((file) => ({
      uid: uid(),
      name: file.name,
      file,
      progress: 0,
      status: "pending",
    }));

    setUploadQueue((prev) => {
      const updated = [...prev, ...newItems];
      void processQueue(updated);
      return updated;
    });
  }

  // --- Expand / detail ---

  async function handleToggle(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (details[id]) return;

    setLoadingDetailId(id);
    try {
      const data = await api.get<CandidateDetail>(
        `/recruiter/candidates/${id}`,
        { auth: true },
      );
      setDetails((prev) => ({ ...prev, [id]: data }));
    } catch {
      // detail will be undefined, panel shows error message
    } finally {
      setLoadingDetailId(null);
    }
  }

  // --- Delete ---

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.delete(`/recruiter/candidates/${id}`, undefined, {
        auth: true,
      });
      setCandidates((prev) => prev.filter((c) => c.id !== id));
      setDetails((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (expandedId === id) setExpandedId(null);
    } catch {
      // leave in list on failure
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <UploadZone onFilesAdded={handleFilesAdded} />

      {/* Upload queue */}
      <UploadQueue items={uploadQueue} />

      {/* Candidates list */}
      <Panel className="p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Candidates
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              Candidate list
            </h2>
          </div>
          {candidates.length > 0 && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
              {candidates.length}
            </span>
          )}
        </div>

        {listLoading ? (
          <div className="mt-6 animate-pulse space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-20 rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : listError ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {listError}
          </div>
        ) : candidates.length === 0 ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-base font-semibold text-slate-900">
              No candidates yet
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Upload resumes using the zone above to start analysis.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                isExpanded={expandedId === candidate.id}
                detail={details[candidate.id]}
                loadingDetail={loadingDetailId === candidate.id}
                confirmDelete={confirmDeleteId === candidate.id}
                deleting={deletingId === candidate.id}
                onToggle={() => void handleToggle(candidate.id)}
                onDelete={() => void handleDelete(candidate.id)}
                onConfirmDelete={() => setConfirmDeleteId(candidate.id)}
                onCancelDelete={() => setConfirmDeleteId(null)}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
