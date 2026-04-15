"use client";

import { useCallback, useEffect, useState } from "react";

import { Panel } from "@/components/panel";
import { ResumeUploadCard } from "@/components/resume-upload-card";
import { deleteResume, getResumePreview, listResumes } from "@/lib/resumes";
import type { ResumeListItem, ResumePreview } from "@/types";

// ─── Status badge ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  parsed:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  uploaded:   "bg-slate-100 text-slate-600 border-slate-200",
  failed:     "bg-rose-50 text-rose-700 border-rose-200",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.uploaded;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardResumesPage() {
  const [resumes, setResumes]           = useState<ResumeListItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState("");
  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [deleteError, setDeleteError]   = useState("");
  const [previewId, setViewId]       = useState<string | null>(null);
  const [previewData, setViewData]   = useState<ResumePreview | null>(null);
  const [previewLoading, setViewLoading] = useState(false);
  const [previewError, setViewError] = useState("");

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

  useEffect(() => { void loadResumes(); }, [loadResumes]);

  async function handleView(id: string) {
    if (previewId === id) {
      setViewId(null);
      setViewData(null);
      return;
    }
    setViewId(id);
    setViewData(null);
    setViewError("");
    setViewLoading(true);
    try {
      setViewData(await getResumePreview(id));
    } catch (e) {
      setViewError(e instanceof Error ? e.message : "Failed to load preview.");
    } finally {
      setViewLoading(false);
    }
  }

  async function handleDelete(resume: ResumeListItem) {
    const name = resume.source_filename ?? resume.title;
    if (!window.confirm(`Delete "${name}"?\n\nThis will also remove any analyses that used this resume.`)) return;
    setDeletingId(resume.id);
    setDeleteError("");
    try {
      await deleteResume(resume.id);
      if (previewId === resume.id) { setViewId(null); setViewData(null); }
      await loadResumes();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
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
                  const isExpanded = previewId === resume.id;
                  const isDeleting = deletingId === resume.id;

                  return (
                    <>
                      <tr
                        key={resume.id}
                        className={`transition-colors ${isExpanded ? "bg-slate-50" : "hover:bg-slate-50/60"}`}
                      >
                        <td className="px-6 py-4">
                          <p className="max-w-[220px] truncate font-medium text-slate-900" title={name}>
                            {name}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">{resume.id}</p>
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
                              onClick={() => void handleView(resume.id)}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                isExpanded
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900"
                              }`}
                            >
                              {isExpanded ? "Close" : "View"}
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

                      {/* Inline preview row */}
                      {isExpanded && (
                        <tr key={`${resume.id}-preview`} className="bg-slate-50">
                          <td colSpan={5} className="px-6 pb-5 pt-0">
                            {previewLoading && (
                              <p className="text-sm text-slate-500">Loading preview…</p>
                            )}
                            {previewError && (
                              <p className="text-sm text-rose-600">{previewError}</p>
                            )}
                            {previewData && (
                              <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                                  Extracted text
                                </p>
                                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 font-mono text-xs leading-5 text-slate-700">
                                  {previewData.raw_text_preview || "No extracted text yet."}
                                </pre>
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
