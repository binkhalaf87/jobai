"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Panel } from "@/components/panel";
import { ResumeUploadCard } from "@/components/resume-upload-card";
import { deleteResume, getResumeFile, listResumes } from "@/lib/resumes";
import type { ResumeListItem } from "@/types";

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  parsed:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  uploaded:   "bg-slate-100 text-slate-600 border-slate-200",
  failed:     "bg-rose-50 text-rose-700 border-rose-200",
};

const PROCESSING_STATUSES = new Set(["uploaded", "processing"]);

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.uploaded;
  const isProcessing = PROCESSING_STATUSES.has(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}>
      {isProcessing && (
        <span className="inline-block h-2 w-2 animate-spin rounded-full border border-current border-t-transparent" />
      )}
      {status}
    </span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

type FileState = { blobUrl: string; filename: string; fileType: string } | null;

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardResumesPage() {
  const [resumes, setResumes]           = useState<ResumeListItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState("");
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [deleteError, setDeleteError]   = useState("");
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [fileState, setFileState]       = useState<FileState>(null);
  const [fileLoading, setFileLoading]   = useState(false);
  const [fileError, setFileError]       = useState("");
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      setResumes(await listResumes());
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load resumes.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Silent refresh (no loading spinner) — used for polling
  const refreshResumes = useCallback(async () => {
    try { setResumes(await listResumes()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadResumes(); }, [loadResumes]);

  // Poll every 3 s while any resume is still processing
  useEffect(() => {
    const hasProcessing = resumes.some((r) => PROCESSING_STATUSES.has(r.processing_status));
    if (pollRef.current) { clearTimeout(pollRef.current); pollRef.current = null; }
    if (hasProcessing) {
      pollRef.current = setTimeout(() => { void refreshResumes(); }, 3000);
    }
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [resumes, refreshResumes]);

  function clearFileState() {
    if (fileState?.blobUrl) URL.revokeObjectURL(fileState.blobUrl);
    setFileState(null);
  }

  async function handleView(resume: ResumeListItem) {
    if (expandedId === resume.id) {
      setExpandedId(null);
      clearFileState();
      return;
    }
    setExpandedId(resume.id);
    clearFileState();
    setFileError("");
    setFileLoading(true);
    try {
      const fallback = resume.source_filename ?? `${resume.id}.${resume.file_type ?? "bin"}`;
      const result = await getResumeFile(resume.id, fallback);
      setFileState({ ...result, fileType: resume.file_type ?? "" });
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Failed to load file.");
    } finally {
      setFileLoading(false);
    }
  }

  async function handleDelete(resume: ResumeListItem) {
    const name = resume.source_filename ?? resume.title;
    if (!window.confirm(`Delete "${name}"?\n\nThis will also remove any analyses that used this resume.`)) return;
    setDeletingId(resume.id);
    setDeleteError("");
    try {
      await deleteResume(resume.id);
      if (expandedId === resume.id) { setExpandedId(null); clearFileState(); }
      await loadResumes();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  function triggerDownload(blobUrl: string, filename: string) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    a.click();
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <ResumeUploadCard onUploadComplete={() => void loadResumes()} />

      {/* Table panel */}
      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Saved CVs</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {loading ? "Loading…" : `${resumes.length} resume${resumes.length !== 1 ? "s" : ""} uploaded`}
            </h2>
          </div>
        </div>

        {/* Error states */}
        {fetchError && (
          <div className="mx-6 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {fetchError}
          </div>
        )}
        {deleteError && (
          <div className="mx-6 mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {deleteError}
          </div>
        )}

        {/* Empty state */}
        {!loading && resumes.length === 0 && !fetchError && (
          <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <p className="text-base font-semibold text-slate-900">No CVs yet</p>
            <p className="mt-2 text-sm text-slate-500">Upload a PDF or DOCX to start.</p>
          </div>
        )}

        {/* Table */}
        {resumes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    File
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Pages
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumes.map((resume) => {
                  const name = resume.source_filename ?? resume.title;
                  const isExpanded = expandedId === resume.id;
                  const isDeleting = deletingId === resume.id;
                  const isPdf = resume.file_type === "pdf";
                  const isReady = resume.processing_status === "parsed";

                  return (
                    <>
                      <tr
                        key={resume.id}
                        className={`transition-colors ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50/60"}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                              isPdf
                                ? "bg-red-50 text-red-600"
                                : "bg-blue-50 text-blue-600"
                            }`}>
                              {resume.file_type ?? "—"}
                            </span>
                            <p className="max-w-[200px] truncate font-medium text-slate-900" title={name}>
                              {name}
                            </p>
                          </div>
                          <p className="ml-10 mt-0.5 font-mono text-[10px] text-slate-400">{resume.id}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{resume.page_count ?? "—"}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={resume.processing_status} />
                        </td>
                        <td className="px-4 py-4 text-slate-600">{formatDate(resume.created_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={!isReady && !isExpanded}
                              onClick={() => void handleView(resume)}
                              title={!isReady ? "Processing…" : undefined}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                isExpanded
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
                              }`}
                            >
                              {isExpanded ? "Close" : isPdf ? "Preview" : "Download"}
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => void handleDelete(resume)}
                              className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-50"
                            >
                              {isDeleting ? "Deleting…" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline panel */}
                      {isExpanded && (
                        <tr key={`${resume.id}-panel`} className="bg-slate-50">
                          <td colSpan={5} className="px-6 pb-5 pt-0">
                            {fileLoading && (
                              <p className="text-sm text-slate-500">Loading…</p>
                            )}
                            {fileError && (
                              <p className="text-sm text-rose-600">{fileError}</p>
                            )}

                            {/* PDF — inline preview */}
                            {fileState && fileState.fileType === "pdf" && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                                    PDF Preview
                                  </p>
                                  <a
                                    href={fileState.blobUrl}
                                    download={fileState.filename}
                                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                                  >
                                    Download
                                  </a>
                                </div>
                                <iframe
                                  src={fileState.blobUrl}
                                  className="h-[600px] w-full rounded-xl border border-slate-200"
                                  title="Resume PDF preview"
                                />
                              </div>
                            )}

                            {/* DOCX — download card */}
                            {fileState && fileState.fileType !== "pdf" && (
                              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-slate-900">{fileState.filename}</p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    DOCX files cannot be previewed in the browser — download to open in Word or Google Docs.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => triggerDownload(fileState.blobUrl, fileState.filename)}
                                  className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
                                >
                                  Download
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
