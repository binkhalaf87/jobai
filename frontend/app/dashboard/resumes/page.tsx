"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ResumeUploadCard } from "@/components/resume-upload-card";
import { deleteResume, getResumeFile, listResumes } from "@/lib/resumes";
import type { ResumeListItem } from "@/types";

/* ─── helpers ── */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  parsed:     "bg-teal-light/30 text-teal border-teal-light",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  uploaded:   "bg-slate-100 text-slate-600 border-slate-200",
  failed:     "bg-rose-50 text-rose-700 border-rose-200",
};
const PROCESSING_STATUSES = new Set(["uploaded", "processing"]);

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations();
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.uploaded;
  const label = t(`resumes.list.statusLabels.${status}`) || status;
  const isProcessing = PROCESSING_STATUSES.has(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style}`}>
      {isProcessing && <span className="h-1.5 w-1.5 animate-spin rounded-full border border-current border-t-transparent" />}
      {label}
    </span>
  );
}

type FileState = { blobUrl: string; filename: string; fileType: string } | null;

/* ─── page ── */
export default function DashboardResumesPage() {
  const t = useTranslations();
  const [resumes, setResumes]         = useState<ResumeListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [fetchError, setFetchError]   = useState("");
  const [deletingId, setDeletingId]   = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [fileState, setFileState]     = useState<FileState>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError]     = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try { setResumes(await listResumes()); }
    catch (e) { setFetchError(e instanceof Error ? e.message : t("list.errors.load")); }
    finally { setLoading(false); }
  }, []);

  const refreshResumes = useCallback(async () => {
    try { setResumes(await listResumes()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadResumes(); }, [loadResumes]);

  useEffect(() => {
    const hasProcessing = resumes.some((r) => PROCESSING_STATUSES.has(r.processing_status));
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    if (hasProcessing) pollRef.current = setTimeout(() => { void refreshResumes(); }, 3000);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [resumes, refreshResumes]);

  function clearFileState() {
    if (fileState?.blobUrl) URL.revokeObjectURL(fileState.blobUrl);
    setFileState(null);
  }

  async function handleView(resume: ResumeListItem) {
    if (expandedId === resume.id) { setExpandedId(null); clearFileState(); return; }
    setExpandedId(resume.id);
    clearFileState();
    setFileError("");
    setFileLoading(true);
    try {
      const fallback = resume.source_filename ?? `${resume.id}.${resume.file_type ?? "bin"}`;
      const result = await getResumeFile(resume.id, fallback);
      setFileState({ ...result, fileType: resume.file_type ?? "" });
    } catch (e) {
      setFileError(e instanceof Error ? e.message : t("list.errors.file"));
    } finally {
      setFileLoading(false);
    }
  }

  async function handleDelete(resume: ResumeListItem) {
    const name = resume.source_filename ?? resume.title;
    if (!window.confirm(t("list.deleteConfirm", { name }))) return;
    setDeletingId(resume.id);
    setDeleteError("");
    try {
      await deleteResume(resume.id);
      if (expandedId === resume.id) { setExpandedId(null); clearFileState(); }
      await loadResumes();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : t("list.errors.delete"));
    } finally {
      setDeletingId(null);
    }
  }

  const parsedCount    = resumes.filter((r) => r.processing_status === "parsed").length;
  const processingCount = resumes.filter((r) => PROCESSING_STATUSES.has(r.processing_status)).length;

  return (
    <div className="space-y-6">
      {/* Upload card */}
      <ResumeUploadCard onUploadComplete={() => void loadResumes()} />

      {/* Stats bar */}
      {resumes.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: t("list.stats.total"), value: resumes.length, color: "bg-brand-50 border-brand-200 text-brand-700" },
            { label: t("list.stats.ready"), value: parsedCount, color: "bg-teal-light/30 border-teal-light text-teal" },
            { label: t("list.stats.processing"), value: processingCount, color: "bg-amber-50 border-amber-200 text-amber-700" },
          ].map((stat) => (
            <div key={stat.label} className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${stat.color}`}>
              <span className="text-base font-black">{stat.value}</span>
              {stat.label}
            </div>
          ))}
          {deleteError && (
            <span className="text-xs text-rose-600">{deleteError}</span>
          )}
        </div>
      )}

      {/* Error */}
      {fetchError && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {fetchError}
          <button type="button" onClick={() => void loadResumes()} className="mr-auto text-xs font-semibold underline">
            {t("list.retry")}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && resumes.length === 0 && !fetchError && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-base font-bold text-slate-900">{t("list.empty")}</p>
          <p className="mt-2 text-sm text-slate-500">{t("list.emptyHint")}</p>
        </div>
      )}

      {/* Resume cards */}
      {!loading && resumes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {resumes.map((resume) => {
            const name       = resume.source_filename ?? resume.title;
            const isExpanded = expandedId === resume.id;
            const isDeleting = deletingId === resume.id;
            const isPdf      = resume.file_type === "pdf";
            const isReady    = resume.processing_status === "parsed";

            return (
              <div key={resume.id} className={[
                "overflow-hidden rounded-2xl border-2 transition-all duration-200",
                isExpanded
                  ? "border-brand-300 bg-brand-50/30 shadow-md shadow-brand-800/8"
                  : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm",
              ].join(" ")}>
                {/* Card header */}
                <div className="flex items-start gap-3 p-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl font-bold text-xs ${isPdf ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-700"}`}>
                    {isPdf ? "PDF" : "DOC"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 text-sm" title={name}>{name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge status={resume.processing_status} />
                      <span className="text-[10px] text-slate-400">{formatDate(resume.created_at)}</span>
                      {resume.page_count != null && (
                        <span className="text-[10px] text-slate-400">{t("list.pagesCount", { count: resume.page_count })}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                  <button
                    type="button"
                    disabled={!isReady && !isExpanded}
                    onClick={() => void handleView(resume)}
                    className={[
                      "flex-1 rounded-xl border py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40",
                      isExpanded
                        ? "border-brand-800 bg-brand-800 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-800",
                    ].join(" ")}
                  >
                    {isExpanded ? t("list.actions.close") : isPdf ? t("list.actions.preview") : t("list.actions.download")}
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => void handleDelete(resume)}
                    className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-50"
                  >
                    {isDeleting ? "…" : t("list.actions.delete")}
                  </button>
                </div>

                {/* Expanded: preview / download */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-white p-4">
                    {fileLoading && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-800 border-t-transparent" />
                        جاري التحميل…
                      </div>
                    )}
                    {fileError && <p className="text-sm text-rose-600">{fileError}</p>}

                    {fileState && fileState.fileType === "pdf" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">معاينة PDF</p>
                          <a
                            href={fileState.blobUrl}
                            download={fileState.filename}
                            className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                          >
                            تحميل
                          </a>
                        </div>
                        <iframe
                          src={fileState.blobUrl}
                          className="h-[500px] w-full rounded-xl border border-slate-200"
                          title="معاينة السيرة الذاتية"
                        />
                      </div>
                    )}

                    {fileState && fileState.fileType !== "pdf" && (
                      <div className="flex items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/40 px-4 py-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{fileState.filename}</p>
                          <p className="mt-0.5 text-xs text-slate-500">لا يمكن معاينة DOCX — قم بتحميله لفتحه في Word أو Google Docs.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => { const a = document.createElement("a"); a.href = fileState.blobUrl; a.download = fileState.filename; a.click(); }}
                          className="flex-shrink-0 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                        >
                          تحميل
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
