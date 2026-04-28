"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Panel } from "@/components/panel";
import { getAIReport, listAIReports, streamAIReport, updateAIReport } from "@/lib/ai-reports";
import { listResumes } from "@/lib/resumes";
import type { AIReportFull, AIReportListItem, ResumeListItem } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-teal-light/30 text-teal border-teal-light",
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

  // Edit / export state
  const [editMode, setEditMode]   = useState<"preview" | "edit">("preview");
  const [editText, setEditText]   = useState("");
  const [copied, setCopied]       = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [activeReportIdForSave, setActiveReportIdForSave] = useState<string | null>(null);

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

  // Sync editText when streaming finishes
  useEffect(() => {
    if (pageState === "done") setEditText(streamText);
  }, [streamText, pageState]);

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
    setEditMode("preview");

    try {
      await streamAIReport(selectedResume, jobDescription, (event) => {
        if (event.type === "id")    setActiveReportId(event.report_id);
        if (event.type === "chunk") setStreamText((prev) => prev + event.text);
        if (event.type === "done")  { setActiveReportId(event.report_id); setActiveReportIdForSave(event.report_id); setSaveState("idle"); setPageState("done"); void loadData(); }
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
      setEditText(report.report_text ?? "");
      setActiveReportIdForSave(report.id);
      setSaveState("idle");
      setEditMode("preview");
      // Don't touch streamText/pageState — keeps the streaming output panel independent
    } catch {
      // ignore
    } finally {
      setViewLoading(false);
    }
  }

  // ─── Export helpers ──────────────────────────────────────────────────────
  function exportWord() {
    const bold = (s: string) => s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const bodyHtml = editText
      .split("\n")
      .map((line) => {
        if (line.startsWith("### ")) return `<h3>${bold(line.slice(4))}</h3>`;
        if (line.startsWith("## "))  return `<h2>${bold(line.slice(3))}</h2>`;
        if (line.startsWith("# "))   return `<h1>${bold(line.slice(2))}</h1>`;
        if (/^[-*] /.test(line))     return `<li>${bold(line.slice(2))}</li>`;
        if (line.trim() === "---")   return "<hr>";
        if (line.trim() === "")      return "<br>";
        return `<p>${bold(line)}</p>`;
      })
      .join("\n");

    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
      xmlns:w='urn:schemas-microsoft-com:office:word'
      xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'>
      <style>
        body{font-family:Arial,sans-serif;font-size:12pt;margin:2cm;color:#111;}
        h1{font-size:16pt;margin-bottom:4pt;}
        h2{font-size:14pt;margin-top:12pt;border-bottom:1px solid #ccc;padding-bottom:2pt;}
        h3{font-size:12pt;margin-top:8pt;}
        li{margin-bottom:2pt;}
        p{margin:2pt 0;}
        hr{border:none;border-top:1px solid #ccc;margin:8pt 0;}
      </style></head>
      <body>${bodyHtml}</body></html>`;

    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const title = viewReport?.resume_title ?? resumes.find((r) => r.id === selectedResume)?.title ?? "resume";
    a.href = url;
    a.download = `${title}-enhanced.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const title = viewReport?.resume_title ?? resumes.find((r) => r.id === selectedResume)?.title ?? "resume";
    const win = window.open("", "_blank");
    if (!win) return;
    const html = outputRef.current?.innerHTML ?? editText;
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>${title} — Enhanced Resume</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 13px; margin: 2cm; color: #111; }
        h1 { font-size: 1.4em; margin-bottom: 0.3em; }
        h2 { font-size: 1.15em; margin-top: 1.2em; border-bottom: 1px solid #ccc; padding-bottom: 0.2em; }
        h3 { font-size: 1em; margin-top: 0.8em; }
        ul { margin: 0.3em 0 0.3em 1.5em; } li { margin-bottom: 0.2em; }
        p  { margin: 0.3em 0; }
      </style>
    </head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  async function saveEdits() {
    if (!activeReportIdForSave) return;
    setSaveState("saving");
    try {
      await updateAIReport(activeReportIdForSave, editText);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("idle");
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(editText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const t = useTranslations("enhancementPage");
  const hasOutput = streamText.length > 0;
  const canSubmit = selectedResume && pageState !== "streaming";
  const showToolbar = pageState === "done" && hasOutput;
  const showHistoryToolbar = viewReport !== null && editText.length > 0;

  return (
    <div className="space-y-6">
      {/* ─── Input panel ─────────────────────────────────────────── */}
      <Panel className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("newImprovement")}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">{t("title")}</h2>

        <div className="mt-6 space-y-4">
          {/* Resume dropdown */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="resume-select">
              {t("resumeLabel")}
            </label>
            {resumes.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("noResumesYet")}{" "}
                <a href="/dashboard/resumes" className="font-semibold text-slate-900 underline underline-offset-2">
                  {t("uploadFirst")}
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
              {t("jdLabel")}{" "}
              <span className="font-normal text-slate-400">{t("jdOptional")}</span>
            </label>
            <textarea
              id="jd-input"
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={t("jdPlaceholder")}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleRequestEnhancement()}
            className="rounded-xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pageState === "streaming" ? t("rewriting") : t("enhanceBtn")}
          </button>
        </div>
      </Panel>

      {/* ─── Output panel ────────────────────────────────────────── */}
      {(hasOutput || pageState === "streaming" || pageState === "error") && (
        <Panel className="p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {pageState === "streaming" ? t("outputLabel.rewriting") : pageState === "done" ? t("outputLabel.done") : t("outputLabel.error")}
              </p>
              {pageState === "streaming" && (
                <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
                  {t("streaming")}
                </span>
              )}
            </div>

            {/* Toolbar — visible only when done */}
            {showToolbar && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode((m) => (m === "edit" ? "preview" : "edit"))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {editMode === "edit" ? t("previewLabel") : t("editLabel")}
                </button>
                {editMode === "edit" && (
                  <button
                    type="button"
                    disabled={saveState === "saving"}
                    onClick={() => void saveEdits()}
                    className="rounded-lg border border-brand-800 bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                  >
                    {saveState === "saving" ? t("savingLabel") : saveState === "saved" ? t("savedLabel") : t("saveLabel")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void copyToClipboard()}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {copied ? t("copiedLabel") : t("copyLabel")}
                </button>
                <button
                  type="button"
                  onClick={() => void exportWord()}
                  className="rounded-lg border border-teal bg-teal-light/20 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal-light/40"
                >
                  {t("exportWord")}
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {t("exportPdf")}
                </button>
              </div>
            )}
          </div>

          {pageState === "error" && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {streamError}
            </div>
          )}

          {hasOutput && (
            editMode === "edit" ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={30}
                dir="auto"
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 shadow-sm focus:border-teal focus:outline-none"
              />
            ) : (
              <div
                ref={outputRef}
                className="prose prose-slate max-w-none text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{editText || streamText}</ReactMarkdown>
              </div>
            )
          )}
        </Panel>
      )}

      {/* ─── History panel ───────────────────────────────────────── */}
      <Panel className="overflow-hidden">
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("pastImprovements")}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {reports.length === 1 ? t("savedRewrites_one") : t("savedRewrites_other", { count: reports.length })}
          </h2>
        </div>

        {reports.length === 0 ? (
          <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
            <p className="text-sm text-slate-500">{t("noRewrites")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("table.resume")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("table.status")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("table.date")}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{r.resume_title ?? t("resumeLabel")}</p>
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
                        {viewReport?.id === r.id ? t("close") : t("view")}
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t("viewingTitle", { title: viewReport.resume_title, date: formatDate(viewReport.created_at) })}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode((m) => (m === "edit" ? "preview" : "edit"))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {editMode === "edit" ? t("previewLabel") : t("editLabel")}
                </button>
                {editMode === "edit" && (
                  <button
                    type="button"
                    disabled={saveState === "saving"}
                    onClick={() => void saveEdits()}
                    className="rounded-lg border border-brand-800 bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                  >
                    {saveState === "saving" ? t("savingLabel") : saveState === "saved" ? t("savedLabel") : t("saveLabel")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void copyToClipboard()}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {copied ? t("copiedLabel") : t("copyLabel")}
                </button>
                <button
                  type="button"
                  onClick={() => void exportWord()}
                  className="rounded-lg border border-teal bg-teal-light/20 px-3 py-1.5 text-xs font-semibold text-teal transition hover:bg-teal-light/40"
                >
                  {t("exportWord")}
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {t("exportPdf")}
                </button>
              </div>
            </div>

            {editMode === "edit" ? (
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={30}
                dir="auto"
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 shadow-sm focus:border-teal focus:outline-none"
              />
            ) : (
              <div
                ref={outputRef}
                className="prose prose-slate max-w-none text-sm [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{editText}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
