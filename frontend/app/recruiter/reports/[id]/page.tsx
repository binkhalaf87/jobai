"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, MapPin } from "lucide-react";

import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportSection = { score: number; analysis: string };

type LocationSection = {
  score: number;
  candidate_location: string | null;
  job_location: string | null;
  is_match: boolean;
  analysis: string;
};

type ExperienceSection = {
  score: number;
  candidate_years: number | null;
  analysis: string;
};

type SkillsSection = {
  score: number;
  matched: string[];
  missing: string[];
  analysis: string;
};

type ReportSections = {
  role_alignment: ReportSection | null;
  location_match: LocationSection | null;
  experience_match: ExperienceSection | null;
  skills_match: SkillsSection | null;
  education_match: ReportSection | null;
};

type Recommendation = { decision: string; action: string; reason: string };

type ReportDetail = {
  overall_score: number;
  decision: string;
  executive_summary: string;
  sections: ReportSections;
  strengths: string[];
  gaps: string[];
  recommendation: Recommendation;
};

type FullReport = {
  id: string;
  resume_id: string;
  candidate_name: string;
  job_id: string | null;
  job_title: string | null;
  job_location: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
  report: ReportDetail | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DECISION_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  "Strong Match": { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Good Match":   { bg: "bg-violet-50",  border: "border-violet-200",  text: "text-violet-700",  dot: "bg-violet-500"  },
  "Partial Match":{ bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400"   },
  "Poor Match":   { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-500"    },
};

const ACTION_CLS: Record<string, string> = {
  "Shortlist": "bg-emerald-600 text-white",
  "Consider":  "bg-violet-600 text-white",
  "Hold":      "bg-amber-500 text-white",
  "Reject":    "bg-rose-600 text-white",
};

// Decision → hex color for PPTX
const DECISION_HEX: Record<string, string> = {
  "Strong Match": "059669",
  "Good Match":   "7C3AED",
  "Partial Match":"D97706",
  "Poor Match":   "DC2626",
};

const ACTION_HEX: Record<string, string> = {
  "Shortlist": "059669",
  "Consider":  "7C3AED",
  "Hold":      "D97706",
  "Reject":    "DC2626",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function scoreColor(s: number) {
  if (s >= 70) return "text-emerald-700";
  if (s >= 40) return "text-amber-700";
  return "text-rose-600";
}

function scoreBg(s: number) {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function scoreHex(s: number) {
  if (s >= 70) return "059669";
  if (s >= 40) return "D97706";
  return "DC2626";
}

function ScoreBar({ score, outOf = 100 }: { score: number; outOf?: number }) {
  const pct = Math.min(100, Math.max(0, (score / outOf) * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${scoreBg(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`w-16 text-right text-xs font-bold tabular-nums ${scoreColor(pct)}`}>
        {outOf === 10 ? `${score}/10` : `${score.toFixed(1)}%`}
      </span>
    </div>
  );
}

function SectionCard({
  title,
  score,
  children,
}: {
  title: string;
  score: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
        <span className={`text-sm font-bold tabular-nums ${scoreColor((score / 10) * 100)}`}>{score}/10</span>
      </div>
      <ScoreBar score={score} outOf={10} />
      {children}
    </div>
  );
}

// ─── Export helpers ────────────────────────────────────────────────────────────

async function exportPdf(report: FullReport, reportRef: React.RefObject<HTMLDivElement | null>) {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  const el = reportRef.current;
  if (!el) return;

  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#f8fafc",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableW = pageW - margin * 2;
  const imgH = (canvas.height * usableW) / canvas.width;
  let yOffset = 0;

  while (yOffset < imgH) {
    if (yOffset > 0) pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, margin - yOffset, usableW, imgH);
    yOffset += pageH - margin * 2;
  }

  const filename = `${report.candidate_name.replace(/\s+/g, "_")}_${(report.job_title ?? "report").replace(/\s+/g, "_")}.pdf`;
  pdf.save(filename);
}

async function exportPptx(report: FullReport) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const d = report.report!;
  const secs = d.sections;
  const decHex = DECISION_HEX[d.decision] ?? "64748B";
  const actHex = ACTION_HEX[d.recommendation.action] ?? "1E293B";
  const filename = `${report.candidate_name.replace(/\s+/g, "_")}_${(report.job_title ?? "report").replace(/\s+/g, "_")}.pptx`;

  const prs = new PptxGenJS();
  prs.layout = "LAYOUT_WIDE";

  const BG = "F8FAFC";
  const SLATE900 = "0F172A";
  const SLATE600 = "475569";
  const SLATE400 = "94A3B8";
  const WHITE = "FFFFFF";

  // helper: add slide with white card background
  function addSlide(title: string) {
    const slide = prs.addSlide();
    slide.background = { color: BG };
    // top bar
    slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.08, fill: { color: decHex } });
    // title
    slide.addText(title.toUpperCase(), {
      x: 0.4, y: 0.15, w: 12, h: 0.35,
      fontSize: 8, bold: true, color: SLATE400, charSpacing: 2,
    });
    return slide;
  }

  // ── Slide 1: Hero ──────────────────────────────────────────────────────────
  {
    const slide = prs.addSlide();
    slide.background = { color: decHex };
    slide.addShape(prs.ShapeType.rect, { x: 0, y: 0, w: "100%", h: "100%", fill: { color: decHex } });

    slide.addText("DEEP MATCH REPORT", {
      x: 0.6, y: 0.5, w: 12, h: 0.35,
      fontSize: 9, bold: true, color: "FFFFFF99", charSpacing: 3,
    });
    slide.addText(report.candidate_name, {
      x: 0.6, y: 0.9, w: 10, h: 0.7,
      fontSize: 32, bold: true, color: WHITE,
    });
    slide.addText(`× ${report.job_title ?? ""}`, {
      x: 0.6, y: 1.55, w: 10, h: 0.45,
      fontSize: 20, color: "FFFFFFCC",
    });
    if (report.job_location) {
      slide.addText(`📍 ${report.job_location}`, {
        x: 0.6, y: 2.05, w: 10, h: 0.3,
        fontSize: 11, color: "FFFFFFAA",
      });
    }
    slide.addText(`${d.overall_score.toFixed(0)}%`, {
      x: 9.5, y: 0.7, w: 3, h: 1.4,
      fontSize: 72, bold: true, color: WHITE, align: "right",
    });
    slide.addText(d.decision, {
      x: 9.5, y: 2.0, w: 3, h: 0.35,
      fontSize: 13, bold: true, color: "FFFFFFCC", align: "right",
    });
    slide.addText(`Generated ${fmtDate(report.created_at)}`, {
      x: 0.6, y: 4.8, w: 12, h: 0.3,
      fontSize: 9, color: "FFFFFF88",
    });
  }

  // ── Slide 2: Executive Summary ─────────────────────────────────────────────
  {
    const slide = addSlide("Executive Summary");
    slide.addShape(prs.ShapeType.rect, {
      x: 0.4, y: 0.6, w: 12.5, h: 4.0,
      fill: { color: WHITE }, line: { color: "E2E8F0", width: 1 }, rectRadius: 0.12,
    });
    slide.addText(d.executive_summary, {
      x: 0.7, y: 0.85, w: 12.0, h: 3.6,
      fontSize: 12, color: SLATE600, lineSpacingMultiple: 1.5, valign: "top", wrap: true,
    });
  }

  // ── Slide 3: Section Scores ────────────────────────────────────────────────
  {
    const slide = addSlide("Analysis Scores");
    const items = [
      { label: "Role Alignment", sec: secs.role_alignment },
      { label: "Location Match", sec: secs.location_match },
      { label: "Experience",     sec: secs.experience_match },
      { label: "Education",      sec: secs.education_match },
      { label: "Skills Match",   sec: secs.skills_match },
    ].filter((x) => x.sec !== null);

    const startY = 0.65;
    const rowH = 0.65;
    items.forEach((item, i) => {
      const y = startY + i * rowH;
      const score = item.sec!.score;
      const pct = (score / 10) * 100;
      const hex = scoreHex(pct);
      const barW = 7.5 * (pct / 100);

      slide.addText(item.label.toUpperCase(), {
        x: 0.4, y, w: 3.0, h: 0.3,
        fontSize: 8, bold: true, color: SLATE400, charSpacing: 1,
      });
      // bar bg
      slide.addShape(prs.ShapeType.rect, {
        x: 3.6, y: y + 0.07, w: 7.5, h: 0.16,
        fill: { color: "E2E8F0" }, rectRadius: 0.08,
      });
      // bar fill
      if (barW > 0) {
        slide.addShape(prs.ShapeType.rect, {
          x: 3.6, y: y + 0.07, w: barW, h: 0.16,
          fill: { color: hex }, rectRadius: 0.08,
        });
      }
      slide.addText(`${score}/10`, {
        x: 11.4, y, w: 1.2, h: 0.3,
        fontSize: 9, bold: true, color: hex, align: "right",
      });
    });
  }

  // ── Slide 4: Skills ────────────────────────────────────────────────────────
  if (secs.skills_match) {
    const slide = addSlide("Skills Match");
    const sm = secs.skills_match;

    // Matched column
    slide.addShape(prs.ShapeType.rect, {
      x: 0.4, y: 0.6, w: 6.0, h: 4.2,
      fill: { color: "F0FDF4" }, line: { color: "BBF7D0", width: 1 }, rectRadius: 0.12,
    });
    slide.addText("MATCHED SKILLS", {
      x: 0.7, y: 0.8, w: 5.5, h: 0.28,
      fontSize: 8, bold: true, color: "059669", charSpacing: 2,
    });

    const matchedText = sm.matched.map((s) => `✓  ${s}`).join("\n");
    slide.addText(matchedText || "—", {
      x: 0.7, y: 1.15, w: 5.5, h: 3.4,
      fontSize: 11, color: "166534", lineSpacingMultiple: 1.6, valign: "top", wrap: true,
    });

    // Missing column
    slide.addShape(prs.ShapeType.rect, {
      x: 6.9, y: 0.6, w: 6.0, h: 4.2,
      fill: { color: "FFFBEB" }, line: { color: "FDE68A", width: 1 }, rectRadius: 0.12,
    });
    slide.addText("MISSING SKILLS", {
      x: 7.2, y: 0.8, w: 5.5, h: 0.28,
      fontSize: 8, bold: true, color: "D97706", charSpacing: 2,
    });
    const missingText = sm.missing.map((s) => `✕  ${s}`).join("\n");
    slide.addText(missingText || "—", {
      x: 7.2, y: 1.15, w: 5.5, h: 3.4,
      fontSize: 11, color: "92400E", lineSpacingMultiple: 1.6, valign: "top", wrap: true,
    });
  }

  // ── Slide 5: Strengths & Gaps ──────────────────────────────────────────────
  {
    const slide = addSlide("Strengths & Gaps");

    slide.addShape(prs.ShapeType.rect, {
      x: 0.4, y: 0.6, w: 6.0, h: 4.2,
      fill: { color: "F0FDF4" }, line: { color: "BBF7D0", width: 1 }, rectRadius: 0.12,
    });
    slide.addText("STRENGTHS", {
      x: 0.7, y: 0.8, w: 5.5, h: 0.28,
      fontSize: 8, bold: true, color: "059669", charSpacing: 2,
    });
    const strText = d.strengths.map((s) => `✓  ${s}`).join("\n");
    slide.addText(strText || "—", {
      x: 0.7, y: 1.15, w: 5.5, h: 3.4,
      fontSize: 11, color: "166534", lineSpacingMultiple: 1.6, valign: "top", wrap: true,
    });

    slide.addShape(prs.ShapeType.rect, {
      x: 6.9, y: 0.6, w: 6.0, h: 4.2,
      fill: { color: "FFF1F2" }, line: { color: "FECDD3", width: 1 }, rectRadius: 0.12,
    });
    slide.addText("GAPS", {
      x: 7.2, y: 0.8, w: 5.5, h: 0.28,
      fontSize: 8, bold: true, color: "E11D48", charSpacing: 2,
    });
    const gapText = d.gaps.map((g) => `✕  ${g}`).join("\n");
    slide.addText(gapText || "—", {
      x: 7.2, y: 1.15, w: 5.5, h: 3.4,
      fontSize: 11, color: "9F1239", lineSpacingMultiple: 1.6, valign: "top", wrap: true,
    });
  }

  // ── Slide 6: Final Recommendation ─────────────────────────────────────────
  {
    const slide = addSlide("Final Recommendation");

    // Decision pill
    slide.addShape(prs.ShapeType.roundRect, {
      x: 0.4, y: 0.65, w: 2.8, h: 0.5,
      fill: { color: actHex }, rectRadius: 0.25,
    });
    slide.addText(d.recommendation.action, {
      x: 0.4, y: 0.65, w: 2.8, h: 0.5,
      fontSize: 13, bold: true, color: WHITE, align: "center", valign: "middle",
    });

    // Decision badge
    slide.addShape(prs.ShapeType.roundRect, {
      x: 3.4, y: 0.65, w: 3.0, h: 0.5,
      fill: { color: `${decHex}22` }, line: { color: decHex, width: 1 }, rectRadius: 0.25,
    });
    slide.addText(d.recommendation.decision, {
      x: 3.4, y: 0.65, w: 3.0, h: 0.5,
      fontSize: 11, bold: true, color: decHex, align: "center", valign: "middle",
    });

    // Reason box
    slide.addShape(prs.ShapeType.rect, {
      x: 0.4, y: 1.35, w: 12.5, h: 3.5,
      fill: { color: WHITE }, line: { color: "E2E8F0", width: 1 }, rectRadius: 0.12,
    });
    slide.addText(d.recommendation.reason, {
      x: 0.7, y: 1.6, w: 12.0, h: 3.0,
      fontSize: 13, color: SLATE600, lineSpacingMultiple: 1.6, valign: "top", wrap: true,
    });

    // Score watermark
    slide.addText(`${d.overall_score.toFixed(0)}%`, {
      x: 9.5, y: 0.55, w: 3.0, h: 0.7,
      fontSize: 36, bold: true, color: decHex, align: "right",
    });
    slide.addText("OVERALL MATCH", {
      x: 9.5, y: 1.2, w: 3.0, h: 0.25,
      fontSize: 7, color: SLATE400, align: "right", charSpacing: 1.5,
    });
  }

  await prs.writeFile({ fileName: filename });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
  const t = useTranslations("recruiter.reportDetailPage");
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"pdf" | "pptx" | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReport();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadReport() {
    try {
      const data = await api.get<FullReport>(`/recruiter/reports/${id}`, { auth: true });
      setReport(data);
      if (data.status === "pending") schedulePoll();
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  function schedulePoll() {
    if (pollCountRef.current >= 20) return;
    pollCountRef.current += 1;
    pollRef.current = setTimeout(async () => {
      try {
        const data = await api.get<FullReport>(`/recruiter/reports/${id}`, { auth: true });
        setReport(data);
        if (data.status === "pending") schedulePoll();
      } catch { /* ignore */ }
    }, 4000);
  }

  async function handleExportPdf() {
    if (!report) return;
    setExporting("pdf");
    try { await exportPdf(report, reportRef); } finally { setExporting(null); }
  }

  async function handleExportPptx() {
    if (!report) return;
    setExporting("pptx");
    try { await exportPptx(report); } finally { setExporting(null); }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
        <p className="text-sm font-semibold text-rose-700">{error ?? t("reportNotFound")}</p>
        <Link href="/recruiter/reports" className="mt-4 inline-block text-xs font-medium text-slate-500 underline">
          {t("backToAllReports")}
        </Link>
      </div>
    );
  }

  // ── Pending ──
  if (report.status === "pending") {
    return (
      <div className="space-y-5">
        <Link href="/recruiter/reports" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700">
          {t("backToReports")}
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-14 text-center space-y-4">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{t("pending.title")}</p>
            <p className="mt-1 text-xs text-slate-400">
              {t("pending.comparing", { candidate: report.candidate_name, job: report.job_title })}
            </p>
            <p className="mt-1 text-xs text-slate-400">{t("pending.timeHint")}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Failed ──
  if (report.status === "failed" || !report.report) {
    return (
      <div className="space-y-5">
        <Link href="/recruiter/reports" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700">
          {t("backToReports")}
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-700">{t("failedState.title")}</p>
          <p className="text-xs text-rose-500">{t("failedState.desc")}</p>
          <Link href="/recruiter/ai-screening" className="mt-2 inline-block rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700">
            {t("backToTalentFit")}
          </Link>
        </div>
      </div>
    );
  }

  const d = report.report;
  const ds = DECISION_STYLES[d.decision] ?? DECISION_STYLES["Partial Match"];
  const secs = d.sections;

  return (
    <div className="space-y-5">

      {/* ── Top bar: back + export buttons ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/recruiter/reports" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700">
          {t("backToReports")}
        </Link>

        <div className="flex items-center gap-2">
          {/* PDF */}
          <button
            onClick={handleExportPdf}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting === "pdf" ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-slate-600" />
            ) : (
              <svg className="h-3.5 w-3.5 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="9" y1="15" x2="15" y2="15" />
                <line x1="9" y1="11" x2="15" y2="11" />
              </svg>
            )}
            {exporting === "pdf" ? t("exporting") : t("exportPdf")}
          </button>

          {/* PowerPoint */}
          <button
            onClick={handleExportPptx}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting === "pptx" ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-slate-600" />
            ) : (
              <svg className="h-3.5 w-3.5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <path d="M8 21h8M12 17v4" />
                <path d="M9 8h3a2 2 0 0 1 0 4H9V8z" />
              </svg>
            )}
            {exporting === "pptx" ? t("exporting") : t("exportPptx")}
          </button>
        </div>
      </div>

      {/* ── Printable report area ── */}
      <div ref={reportRef} className="space-y-5">

        {/* ── Hero card ── */}
        <div className={`rounded-2xl border ${ds.border} ${ds.bg} px-6 py-5`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("deepMatchReport")}</p>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-2">
                <h1 className="text-xl font-bold text-slate-900">{report.candidate_name}</h1>
                <span className="text-slate-300 text-lg">×</span>
                <h2 className="text-lg font-semibold text-slate-700">{report.job_title}</h2>
              </div>
              {report.job_location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={10} />{report.job_location}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">{t("generated", { date: fmtDate(report.created_at) })}</p>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${ds.dot}`} />
                <span className={`text-xl font-black ${ds.text}`}>{d.decision}</span>
              </div>
              <p className={`text-4xl font-black tabular-nums ${ds.text}`}>{d.overall_score.toFixed(0)}%</p>
              <p className="text-[10px] text-slate-400">{t("overallMatch")}</p>
            </div>
          </div>

          {/* Recommendation action pill */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${ACTION_CLS[d.recommendation.action] ?? "bg-slate-800 text-white"}`}>
              {d.recommendation.action}
            </span>
            <span className="text-xs text-slate-500">{d.recommendation.reason}</span>
          </div>
        </div>

        {/* ── Executive Summary ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("executiveSummary")}</p>
          <p className="text-sm leading-7 text-slate-700">{d.executive_summary}</p>
        </div>

        {/* ── Section cards ── */}
        <div className="grid gap-4 md:grid-cols-2">
          {secs.role_alignment && (
            <SectionCard title={t("roleAlignment")} score={secs.role_alignment.score}>
              <p className="text-xs leading-5 text-slate-600">{secs.role_alignment.analysis}</p>
            </SectionCard>
          )}

          {secs.location_match && (
            <SectionCard title={t("locationMatch")} score={secs.location_match.score}>
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin size={10} className="text-slate-400" />
                  {secs.location_match.candidate_location ?? t("notSpecified")}
                </span>
                <span className="text-slate-300">→</span>
                <span className="flex items-center gap-1">
                  <MapPin size={10} className="text-slate-400" />
                  {secs.location_match.job_location ?? t("notSpecified")}
                </span>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${secs.location_match.is_match ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                  {secs.location_match.is_match ? t("locationMatchLabel") : t("locationMismatchLabel")}
                </span>
              </div>
              <p className="text-xs leading-5 text-slate-600">{secs.location_match.analysis}</p>
            </SectionCard>
          )}

          {secs.experience_match && (
            <SectionCard title={t("experience")} score={secs.experience_match.score}>
              {secs.experience_match.candidate_years !== null && (
                <p className="text-xs font-semibold text-slate-700">
                  {t("years", { years: secs.experience_match.candidate_years })}
                </p>
              )}
              <p className="text-xs leading-5 text-slate-600">{secs.experience_match.analysis}</p>
            </SectionCard>
          )}

          {secs.education_match && (
            <SectionCard title={t("education")} score={secs.education_match.score}>
              <p className="text-xs leading-5 text-slate-600">{secs.education_match.analysis}</p>
            </SectionCard>
          )}
        </div>

        {/* ── Skills ── */}
        {secs.skills_match && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("skillsMatch")}</p>
              <span className={`text-sm font-bold tabular-nums ${scoreColor((secs.skills_match.score / 10) * 100)}`}>
                {secs.skills_match.score}/10
              </span>
            </div>
            <ScoreBar score={secs.skills_match.score} outOf={10} />

            <div className="grid gap-4 sm:grid-cols-2">
              {secs.skills_match.matched.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">{t("matchedSkills")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {secs.skills_match.matched.map((s) => (
                      <span key={s} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {secs.skills_match.missing.length > 0 && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">{t("missingSkills")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {secs.skills_match.missing.map((s) => (
                      <span key={s} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs leading-5 text-slate-600">{secs.skills_match.analysis}</p>
          </div>
        )}

        {/* ── Strengths & Gaps ── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">{t("strengths")}</p>
            <ul className="space-y-2">
              {d.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs leading-5 text-emerald-800">
                  <span className="mt-0.5 flex-shrink-0 text-emerald-400">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">{t("gaps")}</p>
            <ul className="space-y-2">
              {d.gaps.map((g, i) => (
                <li key={i} className="flex gap-2 text-xs leading-5 text-rose-800">
                  <span className="mt-0.5 flex-shrink-0 text-rose-400">✕</span>{g}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Final Recommendation ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">{t("finalRecommendation")}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${ACTION_CLS[d.recommendation.action] ?? "bg-slate-800 text-white"}`}>
              {d.recommendation.action}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${ds.bg} ${ds.text} ${ds.border}`}>
              {d.recommendation.decision}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{d.recommendation.reason}</p>
        </div>

      </div>{/* end reportRef */}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
        <Link href="/recruiter/reports" className="hover:text-slate-700 underline underline-offset-2">
          {t("backToAllReports")}
        </Link>
        <Link href={`/recruiter/candidates/${report.resume_id}`} className="flex items-center gap-1 hover:text-slate-700 underline underline-offset-2">
          <FileText size={10} /> {t("viewCandidateProfile")}
        </Link>
      </div>

    </div>
  );
}
