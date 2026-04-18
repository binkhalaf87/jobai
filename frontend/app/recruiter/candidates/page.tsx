"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Users, Upload, Sparkles, ChevronRight } from "lucide-react";

import { api, uploadRequest } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "new" | "shortlisted" | "interview" | "rejected";

type CandidateListItem = {
  id: string;
  title: string;
  parsed_name: string | null;
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

const STAGE_COLORS: Record<Stage, string> = {
  new:        "bg-sky-100 text-sky-700",
  shortlisted:"bg-emerald-100 text-emerald-700",
  interview:  "bg-violet-100 text-violet-700",
  rejected:   "bg-rose-100 text-rose-500",
};

const STAGE_LABELS: Record<Stage, string> = {
  new: "Applied", shortlisted: "Shortlisted", interview: "Interview", rejected: "Rejected",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAccepted(f: File) {
  return ACCEPTED_MIME.has(f.type) || f.name.endsWith(".pdf") || f.name.endsWith(".docx");
}
function uid() { return Math.random().toString(36).slice(2); }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}
function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}
function scoreText(s: number) {
  if (s >= 70) return "text-emerald-700"; if (s >= 40) return "text-amber-700"; return "text-rose-600";
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────

function UploadZone({ onFilesAdded }: { onFilesAdded: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function collect(list: FileList | null) {
    const valid = Array.from(list ?? []).filter(isAccepted);
    if (valid.length) onFilesAdded(valid);
  }

  return (
    <div
      onDragEnter={() => setDragging(true)}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); collect(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-4 text-center transition ${
        dragging ? "border-brand-400 bg-brand-50" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
      }`}
    >
      <input ref={inputRef} type="file" accept=".pdf,.docx" multiple className="hidden"
        onChange={(e) => { collect(e.target.files); e.currentTarget.value = ""; }} />
      <p className="text-sm font-medium text-slate-600">
        Drop resumes or <span className="font-semibold text-slate-900 underline underline-offset-2">browse</span>
        <span className="ml-2 text-xs text-slate-400">PDF · DOCX</span>
      </p>
    </div>
  );
}

function UploadQueue({ items }: { items: FileUploadItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3">
      {items.map((item) => (
        <li key={item.uid} className="flex items-center gap-3 text-xs">
          <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{item.name}</span>
          <span className={`font-semibold ${item.status === "done" ? "text-emerald-600" : item.status === "error" ? "text-rose-600" : "text-slate-400"}`}>
            {item.status === "done" ? "✓" : item.status === "error" ? "✗" : `${item.progress}%`}
          </span>
          {item.status === "uploading" && (
            <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-800 transition-all" style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const uploadingRef = useRef(false);
  const [analyzingAll, setAnalyzingAll] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<string | null>(null);

  async function loadCandidates() {
    try {
      const data = await api.get<CandidateListItem[]>("/recruiter/candidates/", { auth: true });
      setCandidates(data);
    } catch {
      setError("Failed to load candidates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCandidates(); }, []);

  function updateItem(itemUid: string, patch: Partial<FileUploadItem>) {
    setUploadQueue((prev) => prev.map((i) => (i.uid === itemUid ? { ...i, ...patch } : i)));
  }

  const processQueue = useCallback(async (queue: FileUploadItem[]) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    for (const item of queue) {
      if (item.status !== "pending") continue;
      updateItem(item.uid, { status: "uploading", progress: 0 });
      const fd = new FormData();
      fd.append("files", item.file);
      try {
        await uploadRequest<{ resume_ids: string[] }>("/recruiter/candidates/upload", fd, {
          auth: true, onProgress: (p) => updateItem(item.uid, { progress: p }),
        });
        updateItem(item.uid, { status: "done", progress: 100 });
      } catch (err) {
        updateItem(item.uid, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    uploadingRef.current = false;
    setLoading(true);
    void loadCandidates();
  }, []);

  function handleFilesAdded(files: File[]) {
    const newItems: FileUploadItem[] = files.map((f) => ({ uid: uid(), name: f.name, file: f, progress: 0, status: "pending" }));
    setUploadQueue((prev) => { const updated = [...prev, ...newItems]; void processQueue(updated); return updated; });
  }

  async function handleAnalyzeAll() {
    if (analyzingAll) return;
    setAnalyzingAll(true);
    setAnalyzeResult(null);
    try {
      const res = await api.post<{ total_candidates: number; total_created: number; no_text_count: number }>(
        "/recruiter/candidates/analyze-all", undefined, { auth: true }
      );
      setAnalyzeResult(`✦ ${res.total_created} analyses created across ${res.total_candidates} candidates.`);
      setLoading(true);
      void loadCandidates();
    } catch {
      setAnalyzeResult("Analysis failed. Make sure you have jobs added and try again.");
    } finally {
      setAnalyzingAll(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2">
          <Users size={14} className="text-violet-500" />
          <span className="text-sm font-semibold text-slate-700">{candidates.length} candidates</span>
        </div>
        <button
          type="button"
          disabled={analyzingAll || candidates.length === 0}
          onClick={() => void handleAnalyzeAll()}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40"
        >
          <Sparkles size={13} />
          {analyzingAll ? "Analyzing…" : "Analyze All with AI"}
        </button>
        {analyzeResult && (
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            analyzeResult.startsWith("✦") ? "border-violet-200 bg-violet-50 text-violet-800" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}>
            {analyzeResult}
            <button type="button" onClick={() => setAnalyzeResult(null)} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}
      </div>

      {/* ── Upload ── */}
      <UploadZone onFilesAdded={handleFilesAdded} />
      <UploadQueue items={uploadQueue} />

      {/* ── Table ── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-600">{error}</p>
          <button type="button" onClick={() => { setError(null); setLoading(true); void loadCandidates(); }}
            className="mt-3 rounded-lg bg-brand-800 px-4 py-1.5 text-xs font-semibold text-white">Retry</button>
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Upload size={24} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No candidates yet</p>
          <p className="mt-1 text-xs text-slate-400">Upload resumes above to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Candidate</th>
                <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 md:table-cell">Extracted Skills</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Stage</th>
                <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 lg:table-cell">Best Match</th>
                <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 xl:table-cell">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => {
                const name = c.parsed_name ?? c.title;
                const skills = c.best_match_keywords.slice(0, 3);
                return (
                  <tr key={c.id} className="group transition hover:bg-slate-50/70">
                    {/* Name + email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${
                          c.stage === "shortlisted" ? "bg-emerald-500" :
                          c.stage === "interview"   ? "bg-violet-500"  :
                          c.stage === "rejected"    ? "bg-slate-300"   : "bg-slate-600"
                        }`}>
                          {initials(name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-slate-900">{name}</p>
                          {c.email && <p className="truncate text-[11px] text-slate-400">{c.email}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Skills */}
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {skills.length > 0 ? skills.map((s) => (
                          <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{s}</span>
                        )) : (
                          <span className="text-[11px] text-slate-300">—</span>
                        )}
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STAGE_COLORS[c.stage]}`}>
                        {STAGE_LABELS[c.stage]}
                      </span>
                    </td>

                    {/* Best match */}
                    <td className="hidden px-4 py-3 lg:table-cell">
                      {c.best_match_job && c.best_match_score !== null ? (
                        <div>
                          <p className="truncate text-[12px] font-medium text-slate-700 max-w-[140px]">{c.best_match_job}</p>
                          <p className={`text-[11px] font-bold ${scoreText(c.best_match_score)}`}>
                            {Math.round(c.best_match_score)}%
                          </p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">No analysis</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="hidden px-4 py-3 text-[11px] text-slate-400 xl:table-cell">
                      {fmtDate(c.created_at)}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/recruiter/candidates/${c.id}`}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 opacity-0 transition hover:border-brand-300 hover:text-brand-700 group-hover:opacity-100"
                      >
                        View <ChevronRight size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400">
            {candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
