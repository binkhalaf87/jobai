"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Upload, Sparkles, ChevronRight, Trash2 } from "lucide-react";

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

const STAGE_LABEL_KEYS: Record<Stage, string> = {
  new: "stages.new", shortlisted: "stages.shortlisted", interview: "stages.interview", rejected: "stages.rejected",
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
  const t = useTranslations("recruiter.candidatesPage");
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
        {t("uploadZone.dropResumes")} <span className="font-semibold text-slate-900 underline underline-offset-2">{t("uploadZone.browse")}</span>
        <span className="ml-2 text-xs text-slate-400">{t("uploadZone.types")}</span>
      </p>
    </div>
  );
}

function UploadQueue({ items }: { items: FileUploadItem[] }) {
  const t = useTranslations("recruiter.candidatesPage");
  if (!items.length) return null;
  const active = items.filter((i) => i.status !== "error");
  const totalProgress =
    active.length > 0
      ? Math.round(active.reduce((s, i) => s + (i.status === "done" ? 100 : i.progress), 0) / active.length)
      : 0;
  const allDone = items.every((i) => i.status === "done" || i.status === "error");
  const uploading = items.some((i) => i.status === "uploading");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
      {/* Overall progress bar */}
      {!allDone && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{uploading ? t("uploadQueue.uploading") : t("uploadQueue.preparing")}</span>
            <span className="font-semibold">{totalProgress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-brand-700 transition-all duration-300"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      )}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.uid} className="flex items-center gap-3 text-xs">
            <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{item.name}</span>
            <span className={`font-semibold ${item.status === "done" ? "text-emerald-600" : item.status === "error" ? "text-rose-600" : "text-slate-400"}`}>
              {item.status === "done" ? "✓" : item.status === "error" ? "✗" : `${item.progress}%`}
            </span>
            {item.status === "uploading" && (
              <div className="h-1 w-20 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-brand-700 transition-all" style={{ width: `${item.progress}%` }} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecruiterCandidatesPage() {
  const t = useTranslations("recruiter.candidatesPage");
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<FileUploadItem[]>([]);
  const uploadingRef = useRef(false);
  const [screeningAll, setScreeningAll] = useState(false);
  const [screenResult, setScreenResult] = useState<string | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadCandidates() {
    try {
      const data = await api.get<CandidateListItem[]>("/recruiter/candidates/", { auth: true });
      setCandidates(data);
    } catch {
      setError(t("error.failedToLoad"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCandidates(); }, []);

  // Clear selection when candidates list changes
  useEffect(() => { setSelected(new Set()); }, [candidates]);

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === candidates.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(candidates.map((c) => c.id)));
    }
  }

  function startProgress() {
    setActionProgress(0);
    progressTimer.current = setInterval(() => {
      setActionProgress((prev) => {
        if (prev >= 82) { clearInterval(progressTimer.current!); return 82; }
        return prev + 3;
      });
    }, 60);
  }

  function finishProgress(cb?: () => void) {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setActionProgress(100);
    setTimeout(() => { setActionProgress(0); cb?.(); }, 400);
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkAction(true);
    setBulkResult(null);
    setConfirmDelete(false);
    startProgress();
    try {
      const res = await api.post<{ deleted: number }>(
        "/recruiter/candidates/bulk-delete",
        { ids: Array.from(selected) },
        { auth: true }
      );
      finishProgress(() => {
        setBulkResult({ type: "success", text: res.deleted === 1 ? t("bulk.deleted_one", { count: 1 }) : t("bulk.deleted_other", { count: res.deleted }) });
      });
      setLoading(true);
      void loadCandidates();
    } catch {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setActionProgress(0);
      setBulkResult({ type: "error", text: t("bulk.deleteFailed") });
    } finally {
      setBulkAction(false);
    }
  }

  async function handleBulkScreen() {
    if (selected.size === 0) return;
    setBulkAction(true);
    setBulkResult(null);
    startProgress();
    try {
      const res = await api.post<{ queued: number }>(
        "/recruiter/candidates/bulk-screen",
        { ids: Array.from(selected) },
        { auth: true }
      );
      finishProgress(() => {
        setBulkResult({
          type: "success",
          text: res.queued === 1 ? t("bulk.screened_one", { count: 1 }) : t("bulk.screened_other", { count: res.queued }),
        });
      });
    } catch {
      if (progressTimer.current) clearInterval(progressTimer.current);
      setActionProgress(0);
      setBulkResult({ type: "error", text: t("bulk.screenFailed") });
    } finally {
      setBulkAction(false);
    }
  }

  function updateItem(itemUid: string, patch: Partial<FileUploadItem>) {
    setUploadQueue((prev) => prev.map((i) => (i.uid === itemUid ? { ...i, ...patch } : i)));
  }

  const processQueue = useCallback(async (queue: FileUploadItem[]) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;
    let anyUploaded = false;
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
        anyUploaded = true;
      } catch (err) {
        updateItem(item.uid, { status: "error", error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    uploadingRef.current = false;
    setLoading(true);
    await loadCandidates();
    // Auto-trigger analysis for all unanalyzed candidates after upload
    if (anyUploaded) {
      try {
        await api.post("/recruiter/candidates/screen-all", undefined, { auth: true });
      } catch { /* best-effort */ }
    }
  }, []);

  function handleFilesAdded(files: File[]) {
    const newItems: FileUploadItem[] = files.map((f) => ({ uid: uid(), name: f.name, file: f, progress: 0, status: "pending" }));
    setUploadQueue((prev) => { const updated = [...prev, ...newItems]; void processQueue(updated); return updated; });
  }

  async function handleScreenAll() {
    if (screeningAll) return;
    setScreeningAll(true);
    setScreenResult(null);
    try {
      const res = await api.post<{ queued: number }>(
        "/recruiter/candidates/screen-all", undefined, { auth: true }
      );
      setScreenResult(
        res.queued > 0
          ? (res.queued === 1 ? t("bulk.screened_one", { count: 1 }) : t("bulk.screened_other", { count: res.queued }))
          : t("bulk.allScreened")
      );
    } catch {
      setScreenResult(t("bulk.screenFailed"));
    } finally {
      setScreeningAll(false);
    }
  }

  const allSelected = candidates.length > 0 && selected.size === candidates.length;
  const someSelected = selected.size > 0;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Action bar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2">
          <Users size={14} className="text-violet-500" />
          <span className="text-sm font-semibold text-slate-700">
            {candidates.length === 1 ? t("count_one", { count: 1 }) : t("count_other", { count: candidates.length })}
          </span>
        </div>
        <button
          type="button"
          disabled={screeningAll || candidates.length === 0}
          onClick={() => void handleScreenAll()}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-40"
        >
          <Sparkles size={13} />
          {screeningAll ? t("screeningAll") : t("screenAll")}
        </button>
        {screenResult && (
          <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
            screenResult.startsWith("✦") || screenResult.startsWith("All") ? "border-violet-200 bg-violet-50 text-violet-800" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}>
            {screenResult}
            <button type="button" onClick={() => setScreenResult(null)} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}
      </div>

      {/* ── Upload ── */}
      <UploadZone onFilesAdded={handleFilesAdded} />
      <UploadQueue items={uploadQueue} />

      {/* ── Bulk result banner ── */}
      {bulkResult && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium ${
          bulkResult.type === "success" ? "border-teal-200 bg-teal-50 text-teal-700" : "border-rose-200 bg-rose-50 text-rose-700"
        }`}>
          {bulkResult.text}
          <button type="button" onClick={() => setBulkResult(null)} className="ml-4 opacity-50 hover:opacity-100 text-xs">✕</button>
        </div>
      )}

      {/* ── Floating bulk action bar ── */}
      {someSelected && (
        <div className="sticky top-4 z-20 rounded-2xl border border-slate-300 bg-white shadow-lg overflow-hidden">
          {/* Progress bar strip */}
          {bulkAction && (
            <div className="h-1 w-full bg-slate-100">
              <div
                className={`h-full transition-all duration-300 ${confirmDelete ? "bg-rose-500" : "bg-violet-500"}`}
                style={{ width: `${actionProgress}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm font-semibold text-slate-800">
              {selected.size === 1 ? t("bulk.selected_one", { count: selected.size }) : t("bulk.selected_other", { count: selected.size })}
            </span>
            <div className="flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <span className="text-xs text-rose-600 font-medium">
                    {selected.size === 1 ? t("bulk.deleteConfirm_one", { count: selected.size }) : t("bulk.deleteConfirm_other", { count: selected.size })}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleBulkDelete()}
                    disabled={bulkAction}
                    className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                  >
                    {bulkAction ? t("bulk.deleting", { progress: actionProgress }) : t("bulk.confirmDelete")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={bulkAction}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  >
                    {t("bulk.cancel")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void handleBulkScreen()}
                    disabled={bulkAction}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Sparkles size={12} />
                    {bulkAction ? t("bulk.screening", { progress: actionProgress }) : t("bulk.screenBtn")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    disabled={bulkAction}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    {t("bulk.delete")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    disabled={bulkAction}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                  >
                    {t("bulk.clear")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
            className="mt-3 rounded-lg bg-brand-800 px-4 py-1.5 text-xs font-semibold text-white">{t("error.retry")}</button>
        </div>
      ) : candidates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <Upload size={24} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">{t("empty.title")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("empty.desc")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {/* Select all checkbox */}
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-violet-600"
                  />
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("table.candidate")}</th>
                <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 md:table-cell">{t("table.extractedSkills")}</th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("table.stage")}</th>
                <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 lg:table-cell">{t("table.bestMatch")}</th>
                <th className="hidden px-4 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 xl:table-cell">{t("table.added")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {candidates.map((c) => {
                const name = c.parsed_name ?? c.title;
                const skills = c.best_match_keywords.slice(0, 3);
                const isSelected = selected.has(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`group transition ${isSelected ? "bg-violet-50/60" : "hover:bg-slate-50/70"}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(c.id)}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-violet-600"
                      />
                    </td>

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
                        {t(STAGE_LABEL_KEYS[c.stage])}
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
                        <span className="text-[11px] text-slate-300">{t("table.noAnalysis")}</span>
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
                        {t("table.view")} <ChevronRight size={11} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400">
            {candidates.length === 1 ? t("footer_one", { count: 1 }) : t("footer_other", { count: candidates.length })}
            {someSelected && <span className="ml-2 font-semibold text-violet-600">{t("footerSelected", { count: selected.size })}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
