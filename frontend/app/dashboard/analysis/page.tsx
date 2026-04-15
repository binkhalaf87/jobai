"use client";

import Link from "next/link";
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

type ReportSection = { id: string; title: string; shortTitle: string; content: string };

const SHORT_TITLES: Record<number, string> = {
  1: "Summary",
  2: "ATS Score",
  3: "Pro Analysis",
  4: "Career Plan",
  5: "Quick Wins",
  6: "Interview Q&A",
};

function parseReportSections(text: string): ReportSection[] {
  const regex = /^## (Section (\d+) — .+)$/gm;
  const sections: ReportSection[] = [];
  let match: RegExpExecArray | null;
  let lastEnd = 0;
  let lastTitle = "";
  let lastNum = 0;

  while ((match = regex.exec(text)) !== null) {
    if (lastTitle) {
      sections.push({
        id: `sec-${lastNum}`,
        title: lastTitle,
        shortTitle: SHORT_TITLES[lastNum] ?? `Section ${lastNum}`,
        content: text.slice(lastEnd, match.index).trim(),
      });
    }
    lastTitle = match[1];
    lastNum = parseInt(match[2]);
    lastEnd = match.index + match[0].length;
  }
  if (lastTitle) {
    sections.push({
      id: `sec-${lastNum}`,
      title: lastTitle,
      shortTitle: SHORT_TITLES[lastNum] ?? `Section ${lastNum}`,
      content: text.slice(lastEnd).trim(),
    });
  }
  return sections;
}

function extractAtsScore(text: string): number | null {
  const m = text.match(/\*\*ATS Score:\s*(\d+)\/100\*\*/i);
  return m ? parseInt(m[1]) : null;
}

// ─── ATS Score Ring ───────────────────────────────────────────────────────────

function AtsScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? "#10b981" : score >= 65 ? "#3b82f6" : score >= 50 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 50 ? "Fair" : "Needs Work";
  const labelColor = score >= 80 ? "text-emerald-600" : score >= 65 ? "text-blue-600" : score >= 50 ? "text-amber-600" : "text-rose-600";
  const bgColor = score >= 80 ? "bg-emerald-50 border-emerald-200" : score >= 65 ? "bg-blue-50 border-blue-200" : score >= 50 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200";

  return (
    <div className={`flex items-center gap-5 rounded-2xl border p-5 ${bgColor}`}>
      <svg viewBox="0 0 120 120" className="h-24 w-24 shrink-0">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="700" fill={color}>{score}</text>
        <text x="60" y="73" textAnchor="middle" fontSize="11" fill="#94a3b8">/100</text>
      </svg>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">ATS Match Score</p>
        <p className={`mt-1 text-3xl font-bold ${labelColor}`}>{label}</p>
        <p className="mt-1 text-sm text-slate-500">
          {score >= 80
            ? "Your resume is well-optimized for applicant tracking systems."
            : score >= 65
            ? "Good fit — minor improvements can push you into the top tier."
            : score >= 50
            ? "Moderate match — consider tailoring keywords and formatting."
            : "Significant gaps detected — review the ATS section below."}
        </p>
      </div>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

const PROSE_CLS =
  "prose prose-slate max-w-none text-sm leading-relaxed " +
  "prose-headings:font-semibold prose-headings:text-slate-900 " +
  "prose-h2:text-base prose-h3:text-sm " +
  "prose-strong:text-slate-800 " +
  "prose-li:my-0.5 " +
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs " +
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top " +
  "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-left ";

function SectionContent({ content }: { content: string }) {
  return (
    <div className={PROSE_CLS}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// ─── Structured report view ───────────────────────────────────────────────────

function StructuredReport({
  text,
  resumeTitle,
  date,
}: {
  text: string;
  resumeTitle?: string;
  date?: string;
}) {
  const sections = parseReportSections(text);
  const atsScore = extractAtsScore(text);

  // If the report has no recognisable sections, fall back to plain markdown
  if (sections.length === 0) {
    return (
      <div className={PROSE_CLS}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div id="analysis-print-root">
      {/* ── Print header ── */}
      <div className="mb-5 hidden print:block">
        <h1 className="text-2xl font-bold text-slate-900">CV Analysis Report</h1>
        {resumeTitle && (
          <p className="mt-1 text-sm text-slate-500">
            Resume: {resumeTitle}{date ? ` · ${date}` : ""}
          </p>
        )}
      </div>

      {/* ── Export button ── */}
      <div className="mb-5 flex justify-end" data-no-print>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 17V3M7 12l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" />
          </svg>
          Export PDF
        </button>
      </div>

      {/* ── ATS Score banner ── */}
      {atsScore !== null && (
        <div className="mb-6">
          <AtsScoreRing score={atsScore} />
        </div>
      )}

      {/* ── All sections stacked ── */}
      <div className="space-y-6">
        {sections.map((s, i) => (
          <div key={s.id} data-print-section>
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Section {i + 1} of {sections.length}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{s.title}</h2>
            </div>
            <Panel className="p-5 md:p-6">
              <SectionContent content={s.content} />
            </Panel>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Next Steps panel ────────────────────────────────────────────────────────

function NextStepsPanel({
  atsScore,
  jobDescription,
  jobTitle,
}: {
  atsScore: number | null;
  jobDescription: string;
  jobTitle?: string;
}) {
  function goToInterview() {
    if (typeof window !== "undefined") {
      if (jobDescription) sessionStorage.setItem("jobai_interview_jd", jobDescription);
      if (jobTitle) sessionStorage.setItem("jobai_interview_jd_title", jobTitle);
    }
    window.location.href = "/dashboard/ai-interview";
  }

  const scoreMsg =
    atsScore === null
      ? null
      : atsScore >= 80
      ? "Your score is strong. Apply with confidence."
      : atsScore >= 60
      ? "Good score. A few quick improvements can push you higher."
      : "Your score needs work. Consider improving your CV before applying.";

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6" data-no-print>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">What's next?</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Keep moving</h2>
      {scoreMsg && (
        <p className="mt-2 text-sm text-slate-500">{scoreMsg}</p>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          href="/dashboard/job-search"
          className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
        >
          <span className="text-base">🔍</span>
          <p className="text-sm font-semibold text-slate-900">Find jobs</p>
          <p className="text-xs text-slate-500">See roles that fit.</p>
        </Link>
        <button
          type="button"
          onClick={goToInterview}
          className="flex flex-col items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-100"
        >
          <span className="text-base">🎤</span>
          <p className="text-sm font-semibold text-violet-900">Practice interview</p>
          <p className="text-xs text-violet-600">
            {jobDescription ? "JD will be pre-loaded automatically." : "Simulate a mock interview session."}
          </p>
        </button>
        <Link
          href="/dashboard/smart-send"
          className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition hover:border-emerald-300 hover:bg-emerald-100"
        >
          <span className="text-base">📬</span>
          <p className="text-sm font-semibold text-emerald-900">Send with SmartSend</p>
          <p className="text-xs text-emerald-600">Send your CV in batches.</p>
        </Link>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  failed:    "bg-rose-50 text-rose-700 border-rose-200",
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

export default function DashboardAnalysisPage() {
  const [resumes, setResumes]               = useState<ResumeListItem[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [pageState, setPageState]     = useState<PageState>("idle");
  const [streamText, setStreamText]   = useState("");
  const [streamError, setStreamError] = useState("");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const [reports, setReports]     = useState<AIReportListItem[]>([]);
  const [viewReport, setViewReport] = useState<AIReportFull | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const [resumeList, reportList] = await Promise.all([
      listResumes().catch(() => [] as ResumeListItem[]),
      listAIReports("analysis").catch(() => [] as AIReportListItem[]),
    ]);
    setResumes(resumeList);
    setReports(reportList);
    if (resumeList.length > 0 && !selectedResume) setSelectedResume(resumeList[0].id);
  }, [selectedResume]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefill = sessionStorage.getItem("jobai_prefill_jd");
    if (prefill) {
      setJobDescription(prefill);
      sessionStorage.removeItem("jobai_prefill_jd");
      sessionStorage.removeItem("jobai_prefill_jd_title");
    }
  }, []);

  useEffect(() => {
    if (pageState === "streaming") outputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [streamText, pageState]);

  async function handleRequestAnalysis() {
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
      });
    } catch (e) {
      setStreamError(e instanceof Error ? e.message : "Request failed.");
      setPageState("error");
    }
  }

  async function handleViewReport(id: string) {
    if (viewReport?.id === id) { setViewReport(null); setStreamText(""); setPageState("idle"); return; }
    setViewLoading(true);
    try {
      const report = await getAIReport(id);
      setViewReport(report);
      setStreamText(report.report_text ?? "");
      setPageState("done");
    } catch { /* ignore */ }
    finally { setViewLoading(false); }
  }

  const hasOutput = streamText.length > 0;
  const canSubmit = selectedResume && pageState !== "streaming";
  const activeReport = viewReport ?? (activeReportId ? reports.find((r) => r.id === activeReportId) : null);

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div data-no-print>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Tools</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Analyze CV</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          AI-powered report: ATS score, keyword gaps, hiring manager view, career plan, and interview prep.
        </p>
      </div>

      {/* ─── Input panel ─────────────────────────────────────────── */}
      <Panel className="p-6 md:p-8" data-no-print>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">New Analysis</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Pick a CV and run</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="resume-select">Resume</label>
            {resumes.length === 0 ? (
              <p className="text-sm text-slate-500">
                No resumes yet.{" "}
                <a href="/dashboard/resumes" className="font-semibold text-slate-900 underline underline-offset-2">Upload CV →</a>
              </p>
            ) : (
              <select
                id="resume-select"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.source_filename ?? r.title}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="jd-input">
              Target Job Description{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="jd-input"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description…"
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleRequestAnalysis()}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pageState === "streaming" ? (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Generating report…
              </span>
            ) : "Run Analysis"}
          </button>
        </div>
      </Panel>

      {/* ─── Streaming: plain markdown ───────────────────────────── */}
      {pageState === "streaming" && (
        <Panel className="p-6 md:p-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Building your report…</p>
          </div>
          <div ref={outputRef} className={PROSE_CLS}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
          </div>
        </Panel>
      )}

      {/* ─── Error ───────────────────────────────────────────────── */}
      {pageState === "error" && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {streamError}
        </div>
      )}

      {/* ─── Done: structured view ───────────────────────────────── */}
      {pageState === "done" && hasOutput && (
        <div>
          {activeReport && (
            <div className="mb-3 flex items-center gap-2 text-xs text-slate-400" data-no-print>
              <span className="font-medium text-slate-600">{activeReport.resume_title}</span>
              <span>·</span>
              <span>{formatDate(activeReport.created_at)}</span>

            </div>
          )}
          <StructuredReport
            text={streamText}
            resumeTitle={activeReport?.resume_title ?? undefined}
            date={activeReport ? formatDate(activeReport.created_at) : undefined}
          />
          <NextStepsPanel
            atsScore={extractAtsScore(streamText)}
            jobDescription={jobDescription}
            jobTitle={sessionStorage.getItem?.("jobai_prefill_jd_title") ?? undefined}
          />
        </div>
      )}

      {/* ─── History panel ───────────────────────────────────────── */}
      <Panel className="overflow-hidden" data-no-print>
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Past reports</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            {reports.length} saved report{reports.length !== 1 ? "s" : ""}
          </h2>
        </div>

        {reports.length === 0 ? (
          <div className="mx-6 mb-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
            <p className="text-sm text-slate-500">No reports yet. Run your first check above.</p>
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
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/60">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{r.resume_title ?? "Resume"}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(r.created_at)}</p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={r.status !== "completed" || viewLoading}
                        onClick={() => void handleViewReport(r.id)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-500 disabled:opacity-40"
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
      </Panel>
    </div>
  );
}
