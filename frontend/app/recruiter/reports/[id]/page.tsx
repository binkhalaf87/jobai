"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<FullReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

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
      setError("Failed to load report.");
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
        <p className="text-sm font-semibold text-rose-700">{error ?? "Report not found."}</p>
        <Link href="/recruiter/reports" className="mt-4 inline-block text-xs font-medium text-slate-500 underline">
          ← Back to Reports
        </Link>
      </div>
    );
  }

  // ── Pending ──
  if (report.status === "pending") {
    return (
      <div className="space-y-5">
        <Link href="/recruiter/reports" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700">
          ← Reports
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-14 text-center space-y-4">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Generating Report…</p>
            <p className="mt-1 text-xs text-slate-400">
              Comparing <span className="font-semibold">{report.candidate_name}</span> with <span className="font-semibold">{report.job_title}</span>
            </p>
            <p className="mt-1 text-xs text-slate-400">Usually takes 10–20 seconds.</p>
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
          ← Reports
        </Link>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-rose-700">Report generation failed.</p>
          <p className="text-xs text-rose-500">The candidate or job may be missing text data.</p>
          <Link href="/recruiter/ai-screening" className="mt-2 inline-block rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700">
            ← Back to Talent Fit
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

      {/* ── Back ── */}
      <Link href="/recruiter/reports" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700">
        ← Reports
      </Link>

      {/* ── Hero card ── */}
      <div className={`rounded-2xl border ${ds.border} ${ds.bg} px-6 py-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Deep Match Report</p>
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
            <p className="mt-1 text-xs text-slate-400">Generated {fmtDate(report.created_at)}</p>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${ds.dot}`} />
              <span className={`text-xl font-black ${ds.text}`}>{d.decision}</span>
            </div>
            <p className={`text-4xl font-black tabular-nums ${ds.text}`}>{d.overall_score.toFixed(0)}%</p>
            <p className="text-[10px] text-slate-400">overall match</p>
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
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Executive Summary</p>
        <p className="text-sm leading-7 text-slate-700">{d.executive_summary}</p>
      </div>

      {/* ── Section cards ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {secs.role_alignment && (
          <SectionCard title="Role Alignment" score={secs.role_alignment.score}>
            <p className="text-xs leading-5 text-slate-600">{secs.role_alignment.analysis}</p>
          </SectionCard>
        )}

        {secs.location_match && (
          <SectionCard title="Location Match" score={secs.location_match.score}>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin size={10} className="text-slate-400" />
                {secs.location_match.candidate_location ?? "Not specified"}
              </span>
              <span className="text-slate-300">→</span>
              <span className="flex items-center gap-1">
                <MapPin size={10} className="text-slate-400" />
                {secs.location_match.job_location ?? "Not specified"}
              </span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${secs.location_match.is_match ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>
                {secs.location_match.is_match ? "Match" : "Mismatch"}
              </span>
            </div>
            <p className="text-xs leading-5 text-slate-600">{secs.location_match.analysis}</p>
          </SectionCard>
        )}

        {secs.experience_match && (
          <SectionCard title="Experience" score={secs.experience_match.score}>
            {secs.experience_match.candidate_years !== null && (
              <p className="text-xs font-semibold text-slate-700">
                ~{secs.experience_match.candidate_years} years
              </p>
            )}
            <p className="text-xs leading-5 text-slate-600">{secs.experience_match.analysis}</p>
          </SectionCard>
        )}

        {secs.education_match && (
          <SectionCard title="Education" score={secs.education_match.score}>
            <p className="text-xs leading-5 text-slate-600">{secs.education_match.analysis}</p>
          </SectionCard>
        )}
      </div>

      {/* ── Skills ── */}
      {secs.skills_match && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Skills Match</p>
            <span className={`text-sm font-bold tabular-nums ${scoreColor((secs.skills_match.score / 10) * 100)}`}>
              {secs.skills_match.score}/10
            </span>
          </div>
          <ScoreBar score={secs.skills_match.score} outOf={10} />

          <div className="grid gap-4 sm:grid-cols-2">
            {secs.skills_match.matched.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-600">Matched Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {secs.skills_match.matched.map((s) => (
                    <span key={s} className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {secs.skills_match.missing.length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">Missing Skills</p>
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
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">Strengths</p>
          <ul className="space-y-2">
            {d.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs leading-5 text-emerald-800">
                <span className="mt-0.5 flex-shrink-0 text-emerald-400">✓</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">Gaps</p>
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
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Final Recommendation</p>
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

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
        <Link href="/recruiter/reports" className="hover:text-slate-700 underline underline-offset-2">
          ← All Reports
        </Link>
        <Link href={`/recruiter/candidates/${report.resume_id}`} className="flex items-center gap-1 hover:text-slate-700 underline underline-offset-2">
          <FileText size={10} /> View Candidate Profile →
        </Link>
      </div>

    </div>
  );
}
