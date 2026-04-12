"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { api, uploadRequest } from "@/lib/api";
import { Panel } from "@/components/panel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "new" | "shortlisted" | "interview" | "rejected";

type CandidateListItem = {
  id: string;
  title: string;
  email: string | null;
  created_at: string;
  stage: Stage;
  status: string;
  best_match_job: string | null;
  best_match_score: number | null;
  best_match_keywords: string[];
  best_missing_keywords: string[];
  analysis_completed_at: string | null;
};

type FileUploadItem = {
  uid: string;
  name: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  shortlisted: "Shortlisted",
  interview: "Interview",
  rejected: "Rejected",
};

const STAGE_COLORS: Record<Stage, string> = {
  new: "bg-sky-100 text-sky-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  interview: "bg-violet-100 text-violet-700",
  rejected: "bg-rose-100 text-rose-600",
};

const STAGE_BORDER: Record<Stage, string> = {
  new: "",
  shortlisted: "border-l-4 border-l-emerald-400",
  interview: "border-l-4 border-l-violet-400",
  rejected: "opacity-60",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAccepted(file: File) {
  return (
    ACCEPTED_MIME.has(file.type) ||
    file.name.toLowerCase().endsWith(".pdf") ||
    file.name.toLowerCase().endsWith(".docx")
  );
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function analysisFreshness(completedAt: string | null): {
  label: string;
  color: string;
} {
  if (!completedAt) return { label: "No analysis", color: "text-amber-600 bg-amber-50" };
  const hours = (Date.now() - new Date(completedAt).getTime()) / 3_600_000;
  if (hours < 24) return { label: `Fresh · ${Math.round(hours)}h ago`, color: "text-emerald-700 bg-emerald-50" };
  const days = Math.floor(hours / 24);
  if (days <= 7) return { label: `${days}d ago`, color: "text-slate-600 bg-slate-100" };
  return { label: `Stale · ${days}d ago`, color: "text-amber-700 bg-amber-50" };
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
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Stat pills ───────────────────────────────────────────────────────────────

function StatPills({
  candidates,
  activeFilter,
  onFilter,
}: {
  candidates: CandidateListItem[];
  activeFilter: Stage | "all" | "no_analysis";
  onFilter: (f: Stage | "all" | "no_analysis") => void;
}) {
  const counts = {
    new: candidates.filter((c) => c.stage === "new").length,
    shortlisted: candidates.filter((c) => c.stage === "shortlisted").length,
    interview: candidates.filter((c) => c.stage === "interview").length,
    rejected: candidates.filter((c) => c.stage === "rejected").length,
    no_analysis: candidates.filter((c) => !c.analysis_completed_at).length,
  };

  const pills: { key: Stage | "all" | "no_analysis"; label: string; count: number; cls: string }[] = [
    { key: "all", label: "All", count: candidates.length, cls: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
    { key: "new", label: "New", count: counts.new, cls: "bg-sky-50 text-sky-700 hover:bg-sky-100" },
    { key: "shortlisted", label: "Shortlisted", count: counts.shortlisted, cls: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
    { key: "interview", label: "Interview", count: counts.interview, cls: "bg-violet-50 text-violet-700 hover:bg-violet-100" },
    { key: "no_analysis", label: "Awaiting Analysis", count: counts.no_analysis, cls: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onFilter(p.key)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${p.cls} ${
            activeFilter === p.key ? "ring-2 ring-offset-1 ring-slate-400" : ""
          }`}
        >
          {p.label}
          <span className="rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold">
            {p.count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const c = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${scoreColor(c)}`} style={{ width: `${c}%` }} />
      </div>
      <span className={`w-10 text-right text-[11px] font-bold tabular-nums ${scoreText(c)}`}>
        {c.toFixed(0)}%
      </span>
    </div>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({ onFilesAdded }: { onFilesAdded: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function collect(fileList: FileList | null) {
    if (!fileList) return;
    const valid = Array.from(fileList).filter(isAccepted);
    if (valid.length) onFilesAdded(valid);
  }

  return (
    <div
      onDragEnter={() => setDragging(true)}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); collect(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-3xl border-2 border-dashed px-8 py-6 text-center transition ${
        dragging ? "border-slate-700 bg-slate-100" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        multiple
        className="hidden"
        onChange={(e) => { collect(e.target.files); e.currentTarget.value = ""; }}
      />
      <p className="text-sm font-semibold text-slate-700">
        Drop resumes here or <span className="text-slate-900 underline underline-offset-2">browse files</span>
      </p>
      <p className="mt-1 text-xs text-slate-400">PDF and DOCX · multiple files at once</p>
    </div>
  );
}

// ─── Upload queue ─────────────────────────────────────────────────────────────

function UploadQueue({ items }: { items: FileUploadItem[] }) {
  if (items.length === 0) return null;
  return (
    <Panel className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Uploading</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.uid} className="flex items-center gap-3 text-sm">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-slate-700">{item.name}</span>
                <span className="flex-shrink-0 text-xs font-semibold text-slate-400">
                  {item.status === "done" ? "✓" : item.status === "error" ? "✗" : `${item.progress}%`}
                </span>
              </div>
              {item.status !== "done" && item.status !== "error" && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-slate-800 transition-all" style={{ width: `${item.progress}%` }} />
                </div>
              )}
              {item.status === "error" && (
                <p className="mt-0.5 text-xs text-rose-600">{item.error}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

// ─── Candidate card (3-zone) ──────────────────────────────────────────────────

function CandidateCard({
  candidate,
  onStageChange,
  onDelete,
}: {
  candidate: CandidateListItem;
  onStageChange: (id: string, stage: Stage) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stagePending, setStagePending] = useState(false);

  const freshness = analysisFreshness(candidate.analysis_completed_at);
  const hasAnalysis = !!candidate.analysis_completed_at;

  async function handleStageChange(stage: Stage) {
    if (stagePending) return;
    setStagePending(true);
    try {
      await api.patch(`/recruiter/candidates/${candidate.id}/stage`, { stage }, { auth: true });
      onStageChange(candidate.id, stage);
    } catch {
      // revert handled by parent
    } finally {
      setStagePending(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/recruiter/candidates/${candidate.id}`, undefined, { auth: true });
      onDelete(candidate.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <li className={`rounded-3xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-sm ${STAGE_BORDER[candidate.stage]}`}>
      <div className="grid grid-cols-1 gap-0 md:grid-cols-[1fr_auto_auto]">

        {/* ── Zone A: WHO ─────────────────────────────────── */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white ${
              candidate.stage === "shortlisted" ? "bg-emerald-500" :
              candidate.stage === "interview" ? "bg-violet-500" :
              candidate.stage === "rejected" ? "bg-slate-300" : "bg-slate-700"
            }`}>
              {initials(candidate.title)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{candidate.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STAGE_COLORS[candidate.stage]}`}>
                  {STAGE_LABELS[candidate.stage]}
                </span>
              </div>

              {candidate.email && (
                <p className="mt-0.5 truncate text-xs text-slate-400">{candidate.email}</p>
              )}

              {candidate.best_match_job && candidate.best_match_score !== null && (
                <div className="mt-2">
                  <p className="mb-1 text-[11px] text-slate-500">
                    Best match: <span className="font-semibold text-slate-700">{candidate.best_match_job}</span>
                  </p>
                  <ScoreBar score={candidate.best_match_score} />
                </div>
              )}

              {!hasAnalysis && candidate.status === "parsed" && (
                <p className="mt-2 text-xs font-medium text-amber-600">No jobs to match against yet</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Zone B: AI SIGNAL ───────────────────────────── */}
        <div className="border-t border-slate-100 p-5 md:w-56 md:border-l md:border-t-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">AI Signal</p>

          {hasAnalysis ? (
            <>
              {candidate.best_match_keywords.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold text-emerald-600">✦ Strengths</p>
                  <p className="text-xs text-slate-600 leading-5">
                    {candidate.best_match_keywords.slice(0, 2).join(" · ")}
                  </p>
                </div>
              )}
              {candidate.best_missing_keywords.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-semibold text-amber-600">⚠ Gaps</p>
                  <p className="text-xs text-slate-600 leading-5">
                    {candidate.best_missing_keywords.slice(0, 2).join(" · ")}
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="mb-3 text-xs text-amber-600 font-medium">
              {candidate.status === "parsed" ? "Add jobs to run analysis" : "Awaiting analysis…"}
            </p>
          )}

          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${freshness.color}`}>
            {freshness.label}
          </span>
        </div>

        {/* ── Zone C: ACT ─────────────────────────────────── */}
        <div className="flex flex-row items-center gap-2 border-t border-slate-100 p-5 md:w-44 md:flex-col md:items-stretch md:border-l md:border-t-0">
          {/* View profile */}
          <Link
            href={`/recruiter/candidates/${candidate.id}`}
            className="rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            View Profile
          </Link>

          {/* Stage quick actions */}
          {candidate.stage !== "shortlisted" && (
            <button
              type="button"
              disabled={stagePending}
              onClick={() => void handleStageChange("shortlisted")}
              className="rounded-xl border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-40"
            >
              Shortlist ★
            </button>
          )}
          {candidate.stage === "shortlisted" && (
            <button
              type="button"
              disabled={stagePending}
              onClick={() => void handleStageChange("new")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              Unshortlist
            </button>
          )}
          {candidate.stage !== "rejected" && (
            <button
              type="button"
              disabled={stagePending}
              onClick={() => void handleStageChange("rejected")}
              className="rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
            >
              Reject
            </button>
          )}

          {/* Delete */}
          <div className="mt-auto pt-1" onClick={(e) => e.stopPropagation()}>
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-300 transition hover:bg-rose-50 hover:text-rose-400"
              >
                Delete
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="rounded-xl bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white transition hover:bg-rose-700 disabled:opacity-50"
                >
                  {deleting ? "…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
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

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all" | "no_analysis">("all");

  async function loadCandidates() {
    try {
      const data = await api.get<CandidateListItem[]>("/recruiter/candidates/", { auth: true });
      setCandidates(data);
    } catch {
      setListError("Failed to load candidates.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => { void loadCandidates(); }, []);

  // --- Upload ---

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
        await uploadRequest<{ resume_ids: string[] }>("/recruiter/candidates/upload", formData, {
          auth: true,
          onProgress: (p) => updateItem(item.uid, { progress: p }),
        });
        updateItem(item.uid, { status: "done", progress: 100 });
      } catch (err) {
        updateItem(item.uid, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed.",
        });
      }
    }

    uploadingRef.current = false;
    setListLoading(true);
    void loadCandidates();
  }, []);

  function handleFilesAdded(files: File[]) {
    const newItems: FileUploadItem[] = files.map((file) => ({
      uid: uid(), name: file.name, file, progress: 0, status: "pending",
    }));
    setUploadQueue((prev) => {
      const updated = [...prev, ...newItems];
      void processQueue(updated);
      return updated;
    });
  }

  // --- Stage update ---

  function handleStageChange(id: string, stage: Stage) {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
  }

  function handleDelete(id: string) {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  }

  // --- Filtering ---

  const filtered = candidates.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.best_match_job ?? "").toLowerCase().includes(q);

    const matchesStage =
      stageFilter === "all" ||
      (stageFilter === "no_analysis" ? !c.analysis_completed_at : c.stage === stageFilter);

    return matchesSearch && matchesStage;
  });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Recruiter</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-950">Candidates</h1>
        </div>
      </div>

      {/* ── Upload zone ─────────────────────────────────────────── */}
      <UploadZone onFilesAdded={handleFilesAdded} />
      <UploadQueue items={uploadQueue} />

      {/* ── Stat pills + search ─────────────────────────────────── */}
      {!listLoading && !listError && candidates.length > 0 && (
        <div className="space-y-3">
          <StatPills candidates={candidates} activeFilter={stageFilter} onFilter={setStageFilter} />
          <input
            type="text"
            placeholder="Search by name, email, or job…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
          />
        </div>
      )}

      {/* ── Candidate list ──────────────────────────────────────── */}
      {listLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      ) : listError ? (
        <Panel className="p-6">
          <p className="text-sm font-semibold text-rose-600">{listError}</p>
          <button
            type="button"
            onClick={() => { setListError(null); setListLoading(true); void loadCandidates(); }}
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            Retry
          </button>
        </Panel>
      ) : candidates.length === 0 ? (
        <Panel className="p-10 text-center">
          <p className="text-base font-semibold text-slate-900">No candidates yet</p>
          <p className="mt-2 text-sm text-slate-500">Upload resumes using the zone above to start.</p>
        </Panel>
      ) : filtered.length === 0 ? (
        <Panel className="p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">No candidates match this filter</p>
          <button
            type="button"
            onClick={() => { setSearch(""); setStageFilter("all"); }}
            className="mt-3 text-xs font-medium text-slate-500 underline underline-offset-2"
          >
            Clear filters
          </button>
        </Panel>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              onStageChange={handleStageChange}
              onDelete={handleDelete}
            />
          ))}
          <p className="pt-1 text-center text-xs text-slate-400">
            {filtered.length} of {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
            {stageFilter !== "all" || search ? ` · ${fmtDate(new Date().toISOString())}` : ""}
          </p>
        </ul>
      )}
    </div>
  );
}
