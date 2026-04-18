"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Panel } from "@/components/panel";
import { getAIReport, listAIReports, streamAIReport } from "@/lib/ai-reports";
import { listResumes } from "@/lib/resumes";
import type { AIReportFull, AIReportListItem, ResumeListItem } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50  text-amber-700  border-amber-200",
  failed:    "bg-rose-50   text-rose-700   border-rose-200",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[status] ?? STATUS_BADGE.pending}`}>
      {status}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
type PageState = "idle" | "streaming" | "done" | "error";

export default function DashboardEnhancementPage() {
  // Form state
  const [resumes, setResumes]         = useState<ResumeListItem[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Stream state
  const [pageState, setPageState]     = useState<PageState>("idle");
  const [streamText, setStreamText]   = useState("");
  const [streamError, setStreamError] = useState("");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // History
  const [reports, setReports]         = useState<AIReportListItem[]>([]);
  const [viewReport, setViewReport]   = useState<AIReportFull | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  // Load resumes + report history on mount
  const loadData = useCallback(async () => {
    const [resumeList, reportList] = await Promise.all([
      listResumes().catch(() => [] as ResumeListItem[]),
      listAIReports("enhancement").catch(() => [] as AIReportListItem[]),
    ]);
    setResumes(resumeList);
    setReports(reportList);
    if (resumeList.length > 0 && !selectedResume) {
      setSelectedResume(resumeList[0].id);
    }
  }, [selectedResume]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Auto-scroll output as text streams in
  useEffect(() => {
    if (pageState === "streaming") {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [streamText, pageState]);

  async function handleRequestEnhancement() {
    if (!selectedResume) return;

    setPageState("streaming");
    setStreamText("");
    setStreamError("");
    setActiveReportId(null);
    setViewReport(null);

    try {
      await streamAIReport(selectedResume, jobDescription, (event) => {
        if (event.type === "id")    setActiveReportId(event.report_id);
        if (event.type === "chunk") setStreamText((prev) => prev + event.text);
        if (event.type === "done")  { setActiveReportId(event.report_id); setPageState("done"); void loadData(); }
        if (event.type === "error") { setStreamError(event.message); setPageState("error"); }
      }, "enhancement");
    } catch (e) {
      setStreamError(e instanceof Error ? e.message : "Request failed.");
      setPageState("error");
    }
  }

  async function handleViewReport(id: string) {
    if (viewReport?.id === id) { setViewReport(null); return; }
    setViewLoading(true);
    try {
      const report = await getAIReport(id);
      setViewReport(report);
      setStreamText(report.report_text ?? "");
      setPageState("done");
    } catch {
      // ignore
    } finally {
      setViewLoading(false);
    }
  }

  const hasOutput = streamText.length > 0;
  const canSubmit = selectedResume && pageState !== "streaming";

  return (
    <div className="space-y-6">
      {/* ─── Input panel ─────────────────────────────────────────── */}
      <Panel className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">New improvement</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          Rewrite your resume with AI — ATS-optimized, STAR format
        </h2>

        <div className="mt-6 space-y-4">
          {/* Resume dropdown */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="resume-select">
              Resume
            </label>
            {resumes.length === 0 ? (
              <p className="text-sm text-slate-500">
                No resumes uploaded yet.{" "}
                <a href="/dashboard/resumes" className="font-semibold text-slate-900 underline underline-offset-2">
                  Upload one first →
                </a>
              </p>
            ) : (
              <select
                id="resume-select"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.source_filename ?? r.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Optional JD textarea */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="jd-input">
              Target Job Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="jd-input"
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description…"
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleRequestEnhancement()}
            className="rounded-xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pageState === "streaming" ? "Rewriting resume…" : "Enhance Resume"}
          </button>
        </div>
      </Panel>

      {/* ─── Output panel ────────────────────────────────────────── */}
      {(hasOutput || pageState === "streaming" || pageState === "error") && (
        <Panel className="p-6 md:p-8">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {pageState === "streaming" ? "Rewriting…" : pageState === "done" ? "Enhanced Resume" : "Error"}
            </p>
            {pageState === "streaming" && (
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Streaming
              </span>
            )}
          </div>

          {pageState === "error" && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {streamError}
            </div>
          )}

          {hasOutput && (
            <div
              ref={outputRef}
              className="prose prose-slate max-w-none text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
            </div>
          )}
        </Panel>
      )}

      {/* ─── History panel ───────────────────────────────────────── */}
      <Panel className="overflow-hidden">
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Past improvements</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {reports.length} saved rewrite{reports.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {reports.length === 0 ? (
          <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No rewrites yet. Run your first improvement above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Resume</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{r.resume_title ?? "Resume"}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">{r.id}</p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={r.status !== "completed" || viewLoading}
                        onClick={() => void handleViewReport(r.id)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {viewReport?.id === r.id ? "Close" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inline view of a selected historical rewrite */}
        {viewReport && viewReport.report_text && (
          <div className="border-t border-slate-100 px-6 py-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Enhanced Resume — {viewReport.resume_title} — {formatDate(viewReport.created_at)}
            </p>
            <div className="prose prose-slate max-w-none text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{viewReport.report_text}</ReactMarkdown>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
