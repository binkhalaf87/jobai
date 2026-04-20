"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Trash2 } from "lucide-react";

import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportListItem = {
  id: string;
  resume_id: string;
  candidate_name: string;
  job_id: string | null;
  job_title: string | null;
  overall_score: number | null;
  decision: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
  completed_at: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const DECISION_CLS: Record<string, string> = {
  "Strong Match": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Good Match":   "bg-violet-50 text-violet-700 border-violet-200",
  "Partial Match":"bg-amber-50 text-amber-700 border-amber-200",
  "Poor Match":   "bg-rose-50 text-rose-700 border-rose-200",
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const t = useTranslations("recruiter.reportsPage");
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.get<ReportListItem[]>("/recruiter/reports/", { auth: true })
      .then(setReports)
      .catch(() => setError(t("error")))
      .finally(() => setLoading(false));
  }, [t]);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await api.delete(`/recruiter/reports/${id}`, undefined, { auth: true });
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-teal-600" />
          <p className="text-[15px] font-bold tracking-tight text-slate-900">{t("title")}</p>
          {reports.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{reports.length}</span>
          )}
        </div>
        <Link
          href="/recruiter/ai-screening"
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          {t("talentFitLink")}
        </Link>
      </div>

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-14 text-center">
          <FileText size={24} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">{t("empty.title")}</p>
          <p className="mt-1 text-xs text-slate-400">{t("empty.desc")}</p>
          <Link
            href="/recruiter/ai-screening"
            className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            {t("empty.goToTalentFit")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => {
            const isDel = deleting === report.id;
            return (
              <li key={report.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-semibold text-slate-900">{report.candidate_name}</p>
                      <span className="text-slate-300">×</span>
                      <p className="text-[15px] font-semibold text-slate-700">{report.job_title ?? "—"}</p>
                      {report.decision && (
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${DECISION_CLS[report.decision] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {report.decision}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                      <span>{fmtDate(report.created_at)}</span>
                      {report.overall_score !== null && (
                        <span className={`font-bold ${scoreColor(report.overall_score)}`}>
                          {t("matchPercent", { score: report.overall_score.toFixed(1) })}
                        </span>
                      )}
                      {report.status === "pending" && (
                        <span className="flex items-center gap-1 text-violet-500 font-semibold">
                          <span className="inline-block h-2 w-2 animate-spin rounded-full border border-violet-400 border-t-violet-600" />
                          {t("generating")}
                        </span>
                      )}
                      {report.status === "failed" && (
                        <span className="font-semibold text-rose-500">{t("failed")}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {report.status === "completed" && (
                      <Link
                        href={`/recruiter/reports/${report.id}`}
                        className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
                      >
                        <FileText size={11} /> {t("viewReport")}
                      </Link>
                    )}
                    {report.status === "pending" && (
                      <Link
                        href={`/recruiter/reports/${report.id}`}
                        className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        {t("view")}
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDelete(report.id)}
                      disabled={isDel}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-400 transition hover:border-rose-200 hover:text-rose-500 disabled:opacity-40"
                    >
                      <Trash2 size={12} />
                      {isDel ? "…" : ""}
                    </button>
                  </div>

                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
