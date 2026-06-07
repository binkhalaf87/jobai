"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2, Upload, FileSpreadsheet, BarChart3, Plus, Eye, Loader2,
  CheckCircle, AlertCircle, Clock, Sparkles, ChevronRight, X,
} from "lucide-react";

import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type Company = { id: string; name: string; cr_number: string | null };

type Decision = {
  id: string; company_id: string; company_name: string;
  source_filename: string | null; decision_number: string | null;
  decision_date: string | null; decision_title: string | null;
  issuing_authority: string | null; targeted_professions: Profession[] | null;
  processing_status: string; created_at: string;
};

type Profession = { name: string; target_percentage: number; notes: string | null };

type Report = {
  id: string; company_id: string; company_name: string;
  source_filename: string | null; report_date: string | null;
  report_label: string | null;
  summary: GosiSummary | null;
  processing_status: string; created_at: string;
};

type GosiSummary = {
  total: number; saudi_count: number; non_saudi_count: number;
  saudization_pct: number;
  by_profession: Record<string, { total: number; saudi: number; pct: number }>;
};

type ProfessionGap = {
  profession: string; current_count: number; current_saudi: number;
  current_pct: number; target_pct: number; gap_pct: number; needed: number;
  notes: string | null;
};

type Analysis = {
  id: string; decision_id: string; report_id: string;
  current_pct: number | null; target_pct: number | null; gap_pct: number | null;
  profession_gaps: ProfessionGap[] | null;
  ai_status: string; ai_recommendations: string | null;
  decision?: Decision; report?: Report;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  uploaded:   "bg-slate-100 text-slate-600",
  processing: "bg-amber-100 text-amber-700",
  extracted:  "bg-emerald-100 text-emerald-700",
  failed:     "bg-rose-100 text-rose-700",
};

const STATUS_LABEL: Record<string, string> = {
  uploaded:   "مُحمَّل",
  processing: "جارٍ المعالجة...",
  extracted:  "مكتمل",
  failed:     "فشل",
};

function StatusIcon({ s }: { s: string }) {
  if (s === "extracted") return <CheckCircle size={13} className="text-emerald-600" />;
  if (s === "failed")    return <AlertCircle size={13} className="text-rose-500" />;
  if (s === "processing") return <Loader2 size={13} className="animate-spin text-amber-600" />;
  return <Clock size={13} className="text-slate-400" />;
}

function pctColor(pct: number) {
  if (pct >= 70) return "text-emerald-700";
  if (pct >= 40) return "text-amber-700";
  return "text-rose-600";
}

function pctBarColor(pct: number) {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("ar-SA"); } catch { return iso; }
}

// ── Tab: Companies modal ───────────────────────────────────────────────────────

function CompanyModal({
  companies,
  onAdd,
  onClose,
}: {
  companies: Company[];
  onAdd: (name: string, cr: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [cr, setCr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    try { await onAdd(name.trim(), cr.trim()); setName(""); setCr(""); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">إدارة الشركات</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
        </div>

        <div className="mb-4 space-y-2">
          {companies.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Building2 size={14} className="text-slate-400" />
              <span className="flex-1 text-sm font-medium text-slate-800">{c.name}</span>
              {c.cr_number && <span className="text-[11px] text-slate-400">{c.cr_number}</span>}
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-2">لا توجد شركات بعد</p>
          )}
        </div>

        <div className="space-y-2 border-t pt-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الشركة *"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            dir="rtl"
          />
          <input
            value={cr}
            onChange={(e) => setCr(e.target.value)}
            placeholder="رقم السجل التجاري (اختياري)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            dir="rtl"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            إضافة شركة
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Professions modal ─────────────────────────────────────────────────────

function ProfessionsModal({ decision, onClose }: { decision: Decision; onClose: () => void }) {
  const profs = decision.targeted_professions || [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">المهن المستهدفة</h3>
            <p className="text-[12px] text-slate-400">{decision.decision_title || decision.decision_number || "قرار التوطين"}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
        </div>

        {profs.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">لا توجد مهن مستخرجة</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-slate-500">المهنة</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500">نسبة التوطين المستهدفة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profs.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800" dir="rtl">{p.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${pctColor(p.target_percentage)}`}>
                        {p.target_percentage?.toFixed(0) ?? "—"}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Employees modal ───────────────────────────────────────────────────────

function EmployeesModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const [fullData, setFullData] = useState<{ employees: Record<string, string>[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // The summary is already in the report object. Employees are embedded too.
  const summary = report.summary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">ملخص التقرير</h3>
            <p className="text-[12px] text-slate-400">{report.source_filename}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16} /></button>
        </div>

        {summary ? (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "الإجمالي", value: summary.total, cls: "text-slate-800" },
                { label: "السعوديون", value: summary.saudi_count, cls: "text-emerald-700" },
                { label: "غير السعوديين", value: summary.non_saudi_count, cls: "text-slate-600" },
                { label: "نسبة التوطين", value: `${summary.saudization_pct?.toFixed(1)}%`, cls: pctColor(summary.saudization_pct) },
              ].map(({ label, value, cls }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className={`text-xl font-bold ${cls}`}>{value}</p>
                  <p className="text-[11px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* By profession */}
            {Object.keys(summary.by_profession).length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">توزيع المهن</p>
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-right text-[11px] text-slate-500">المهنة</th>
                        <th className="px-3 py-2 text-center text-[11px] text-slate-500">الإجمالي</th>
                        <th className="px-3 py-2 text-center text-[11px] text-slate-500">سعودي</th>
                        <th className="px-3 py-2 text-center text-[11px] text-slate-500">النسبة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {Object.entries(summary.by_profession).map(([title, stats]) => (
                        <tr key={title} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 text-slate-700" dir="rtl">{title}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{stats.total}</td>
                          <td className="px-3 py-2 text-center text-emerald-700">{stats.saudi}</td>
                          <td className={`px-3 py-2 text-center font-semibold ${pctColor(stats.pct)}`}>{stats.pct?.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400 py-6">لا تتوفر بيانات ملخص</p>
        )}
      </div>
    </div>
  );
}

// ── Analysis Dashboard ─────────────────────────────────────────────────────────

function AnalysisDashboard({ analysis, onRequestAI }: { analysis: Analysis; onRequestAI: () => Promise<void> }) {
  const [aiLoading, setAiLoading] = useState(false);

  const gaps = analysis.profession_gaps || [];
  const currentPct = analysis.current_pct ?? 0;
  const targetPct = analysis.target_pct ?? 0;
  const gapPct = analysis.gap_pct ?? 0;
  const summary = analysis.report?.summary;

  async function handleAI() {
    setAiLoading(true);
    try { await onRequestAI(); } finally { setAiLoading(false); }
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="التوطين الحالي" value={`${currentPct.toFixed(1)}%`} color={pctColor(currentPct)} sub="نسبة السعوديين الحالية" />
        <KPICard label="النسبة المستهدفة" value={`${targetPct.toFixed(1)}%`} color="text-brand-600" sub="وفق قرار التوطين" />
        <KPICard label="الفجوة" value={`${gapPct.toFixed(1)}%`} color={gapPct > 0 ? "text-rose-600" : "text-emerald-600"} sub={gapPct > 0 ? "يحتاج تحسيناً" : "تجاوز الهدف"} />
        <KPICard label="السعوديون" value={String(summary?.saudi_count ?? "—")} color="text-emerald-700" sub={`من ${summary?.total ?? "—"} موظف`} />
      </div>

      {/* Visual: Saudi vs Non-Saudi bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="mb-3 text-sm font-bold text-slate-700">توزيع الجنسية</p>
        <div className="space-y-3">
          <BarItem label="سعوديون" value={currentPct} target={null} color="bg-emerald-500" />
          <BarItem label="غير سعوديين" value={100 - currentPct} target={null} color="bg-slate-300" />
          <div className="mt-1 h-px w-full bg-slate-100" />
          <BarItem label="الهدف المستهدف" value={targetPct} target={null} color="bg-brand-500" dashed />
        </div>
      </div>

      {/* Profession gaps */}
      {gaps.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="mb-3 text-sm font-bold text-slate-700">المهن المستهدفة — الحالي مقابل الهدف</p>
          <div className="space-y-4">
            {gaps.map((g, i) => (
              <div key={i}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[13px] font-medium text-slate-700">{g.profession}</span>
                  <div className="flex items-center gap-3 text-[12px]">
                    <span className={`font-bold ${pctColor(g.current_pct)}`}>{g.current_pct.toFixed(0)}%</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-brand-600 font-semibold">هدف {g.target_pct.toFixed(0)}%</span>
                    {g.needed > 0 && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] text-rose-600">
                        يحتاج {g.needed}
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`absolute inset-y-0 right-0 rounded-full transition-all ${pctBarColor(g.current_pct)}`}
                    style={{ width: `${Math.min(g.current_pct, 100)}%` }}
                  />
                  {/* target marker */}
                  <div
                    className="absolute inset-y-0 w-0.5 bg-brand-500/70"
                    style={{ right: `${Math.min(g.target_pct, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps table */}
      {gaps.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-bold text-slate-700">جدول تفاصيل الفجوات</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-right text-[11px] text-slate-500">المهنة</th>
                  <th className="px-4 py-3 text-center text-[11px] text-slate-500">الإجمالي</th>
                  <th className="px-4 py-3 text-center text-[11px] text-slate-500">السعوديون</th>
                  <th className="px-4 py-3 text-center text-[11px] text-slate-500">الحالي %</th>
                  <th className="px-4 py-3 text-center text-[11px] text-slate-500">الهدف %</th>
                  <th className="px-4 py-3 text-center text-[11px] text-slate-500">الفجوة</th>
                  <th className="px-4 py-3 text-center text-[11px] text-slate-500">مطلوب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gaps.map((g, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{g.profession}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{g.current_count}</td>
                    <td className="px-4 py-3 text-center text-emerald-700">{g.current_saudi}</td>
                    <td className={`px-4 py-3 text-center font-semibold ${pctColor(g.current_pct)}`}>{g.current_pct.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-center text-brand-600 font-semibold">{g.target_pct.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-center font-bold ${g.gap_pct > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                      {g.gap_pct > 0 ? "+" : ""}{g.gap_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {g.needed > 0 ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[12px] font-semibold text-rose-700">{g.needed}</span>
                      ) : (
                        <span className="text-emerald-600">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Sparkles size={15} className="text-brand-500" />
            توصيات الذكاء الاصطناعي
          </p>
          {analysis.ai_status !== "completed" && (
            <button
              onClick={handleAI}
              disabled={aiLoading || analysis.ai_status === "pending"}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {aiLoading || analysis.ai_status === "pending"
                ? <><Loader2 size={12} className="animate-spin" /> جارٍ التوليد...</>
                : <><Sparkles size={12} /> توليد التوصيات</>}
            </button>
          )}
        </div>

        {analysis.ai_status === "completed" && analysis.ai_recommendations ? (
          <div className="prose prose-sm max-w-none rounded-xl bg-brand-50/50 p-4 text-slate-700 text-[13px] leading-relaxed whitespace-pre-wrap">
            {analysis.ai_recommendations}
          </div>
        ) : analysis.ai_status === "failed" ? (
          <p className="text-sm text-rose-500">فشل توليد التوصيات. حاول مجدداً.</p>
        ) : (
          <p className="text-sm text-slate-400">اضغط على "توليد التوصيات" للحصول على تحليل تفصيلي من الذكاء الاصطناعي.</p>
        )}
      </div>
    </div>
  );
}

function KPICard({ label, value, color, sub }: { label: string; value: string; color: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="mt-0.5 text-[12px] font-semibold text-slate-700">{label}</p>
      <p className="text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

function BarItem({ label, value, color, dashed }: { label: string; value: number; target: null; color: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-right text-[12px] text-slate-600 shrink-0">{label}</span>
      <div className="relative flex-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`absolute inset-y-0 right-0 rounded-full transition-all ${color} ${dashed ? "opacity-50" : ""}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`w-12 text-left text-[12px] font-semibold text-slate-700 shrink-0`}>{value.toFixed(1)}%</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type Tab = "decisions" | "reports" | "analysis";

export default function SaudizationPage() {
  const [tab, setTab] = useState<Tab>("decisions");

  // Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Decisions tab
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(true);
  const [uploadingDecision, setUploadingDecision] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const decisionFileRef = useRef<HTMLInputElement>(null);
  const [decisionCompany, setDecisionCompany] = useState("");

  // Reports tab
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const reportFileRef = useRef<HTMLInputElement>(null);
  const [reportCompany, setReportCompany] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [reportLabel, setReportLabel] = useState("");

  // Analysis tab
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [analysisDec, setAnalysisDec] = useState("");
  const [analysisRep, setAnalysisRep] = useState("");
  const [creatingAnalysis, setCreatingAnalysis] = useState(false);

  // Poll for processing items
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCompanies();
    loadDecisions();
    loadReports();
    loadAnalyses();
  }, []);

  // Poll if any item is processing
  useEffect(() => {
    const hasProcessing =
      decisions.some((d) => d.processing_status === "processing" || d.processing_status === "uploaded") ||
      reports.some((r) => r.processing_status === "processing" || r.processing_status === "uploaded");

    if (hasProcessing) {
      pollingRef.current = setTimeout(() => { loadDecisions(); loadReports(); }, 3000);
    }
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current); };
  }, [decisions, reports]);

  async function loadCompanies() {
    try { setCompanies(await api.get<Company[]>("/recruiter/saudization/companies")); } catch {}
  }

  async function loadDecisions() {
    try {
      const data = await api.get<Decision[]>("/recruiter/saudization/decisions");
      setDecisions(data);
    } catch {}
    finally { setDecisionsLoading(false); }
  }

  async function loadReports() {
    try {
      const data = await api.get<Report[]>("/recruiter/saudization/reports");
      setReports(data);
    } catch {}
    finally { setReportsLoading(false); }
  }

  async function loadAnalyses() {
    try {
      const data = await api.get<Analysis[]>("/recruiter/saudization/analyses");
      setAnalyses(data);
    } catch {}
    finally { setAnalysesLoading(false); }
  }

  async function addCompany(name: string, cr: string) {
    const c = await api.post<Company>("/recruiter/saudization/companies", { name, cr_number: cr || null });
    setCompanies((prev) => [c, ...prev]);
  }

  async function uploadDecision(file: File) {
    if (!decisionCompany) { alert("اختر الشركة أولاً"); return; }
    setUploadingDecision(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("company_id", decisionCompany);
      const d = await api.post<Decision>("/recruiter/saudization/decisions/upload", fd);
      setDecisions((prev) => [d, ...prev]);
    } catch (e: any) {
      alert(e?.message || "حدث خطأ أثناء رفع الملف");
    } finally {
      setUploadingDecision(false);
      if (decisionFileRef.current) decisionFileRef.current.value = "";
    }
  }

  async function uploadReport(file: File) {
    if (!reportCompany) { alert("اختر الشركة أولاً"); return; }
    setUploadingReport(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("company_id", reportCompany);
      if (reportDate) fd.append("report_date", reportDate);
      if (reportLabel) fd.append("report_label", reportLabel);
      const r = await api.post<Report>("/recruiter/saudization/reports/upload", fd);
      setReports((prev) => [r, ...prev]);
    } catch (e: any) {
      alert(e?.message || "حدث خطأ أثناء رفع الملف");
    } finally {
      setUploadingReport(false);
      if (reportFileRef.current) reportFileRef.current.value = "";
    }
  }

  async function createAnalysis() {
    if (!analysisDec || !analysisRep) { alert("اختر القرار والتقرير"); return; }
    setCreatingAnalysis(true);
    try {
      const a = await api.post<Analysis>("/recruiter/saudization/analyses", {
        decision_id: analysisDec,
        report_id: analysisRep,
      });
      setAnalyses((prev) => [a, ...prev]);
      // Load full analysis with decision/report info
      const full = await api.get<Analysis>(`/recruiter/saudization/analyses/${a.id}`);
      setSelectedAnalysis(full);
    } catch (e: any) {
      alert(e?.message || "تأكد أن القرار والتقرير اكتملت معالجتهما");
    } finally {
      setCreatingAnalysis(false);
    }
  }

  async function requestAI(analysisId: string) {
    await api.post<Analysis>(`/recruiter/saudization/analyses/${analysisId}/ai`, {});
    // Poll until completed
    let tries = 0;
    while (tries < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      const updated = await api.get<Analysis>(`/recruiter/saudization/analyses/${analysisId}`);
      if (updated.ai_status !== "pending") {
        setSelectedAnalysis(updated);
        break;
      }
      tries++;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">أداة التوطين</h1>
          <p className="text-[13px] text-slate-500">قرارات التوطين • تقارير GOSI • تحليل الفجوات</p>
        </div>
        <button
          onClick={() => setShowCompanyModal(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Building2 size={13} />
          الشركات ({companies.length})
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {([
          { id: "decisions", label: "قرارات التوطين", icon: <Upload size={13} /> },
          { id: "reports",   label: "تقارير التأمينات", icon: <FileSpreadsheet size={13} /> },
          { id: "analysis",  label: "التحليل والداشبورد", icon: <BarChart3 size={13} /> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-all",
              tab === t.id
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Decisions Tab ──────────────────────────────────────────────────── */}
      {tab === "decisions" && (
        <div className="space-y-4">
          {/* Upload card */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <p className="mb-3 text-sm font-bold text-slate-700">رفع قرار توطين (PDF)</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-40">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">الشركة *</label>
                <select
                  value={decisionCompany}
                  onChange={(e) => setDecisionCompany(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
                  dir="rtl"
                >
                  <option value="">اختر الشركة</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <input
                ref={decisionFileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadDecision(e.target.files[0])}
              />
              <button
                onClick={() => decisionFileRef.current?.click()}
                disabled={uploadingDecision || !decisionCompany}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {uploadingDecision ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                رفع PDF
              </button>
            </div>
            {companies.length === 0 && (
              <p className="mt-2 text-[12px] text-amber-600">
                أضف شركة أولاً من خلال زر "الشركات" في الأعلى
              </p>
            )}
          </div>

          {/* Decisions list */}
          {decisionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
          ) : decisions.length === 0 ? (
            <EmptyState icon={<Upload size={24} />} title="لا توجد قرارات بعد" sub="ارفع ملف PDF لقرار التوطين للبدء" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-[11px] text-slate-500">القرار</th>
                    <th className="px-4 py-3 text-right text-[11px] text-slate-500">الشركة</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">التاريخ</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">الحالة</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {decisions.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 truncate max-w-xs">
                          {d.decision_title || d.decision_number || d.source_filename || "قرار غير مُعنوَن"}
                        </p>
                        {d.decision_number && <p className="text-[11px] text-slate-400">رقم: {d.decision_number}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{d.company_name}</td>
                      <td className="px-4 py-3 text-center text-[12px] text-slate-500">{d.decision_date || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <StatusIcon s={d.processing_status} />
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[d.processing_status] || STATUS_BADGE.uploaded}`}>
                            {STATUS_LABEL[d.processing_status] || d.processing_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.processing_status === "extracted" && (
                          <button
                            onClick={() => setSelectedDecision(d)}
                            className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
                          >
                            <Eye size={12} /> عرض المهن
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Reports Tab ─────────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-4">
          {/* Upload card */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <p className="mb-3 text-sm font-bold text-slate-700">رفع تقرير GOSI (Excel)</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-40">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">الشركة *</label>
                <select
                  value={reportCompany}
                  onChange={(e) => setReportCompany(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
                  dir="rtl"
                >
                  <option value="">اختر الشركة</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="min-w-32">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">تاريخ التقرير</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div className="flex-1 min-w-32">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">تسمية التقرير</label>
                <input
                  value={reportLabel}
                  onChange={(e) => setReportLabel(e.target.value)}
                  placeholder="مثال: يونيو 2025"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                  dir="rtl"
                />
              </div>
              <input
                ref={reportFileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadReport(e.target.files[0])}
              />
              <button
                onClick={() => reportFileRef.current?.click()}
                disabled={uploadingReport || !reportCompany}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {uploadingReport ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                رفع Excel
              </button>
            </div>
          </div>

          {/* Reports list */}
          {reportsLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
          ) : reports.length === 0 ? (
            <EmptyState icon={<FileSpreadsheet size={24} />} title="لا توجد تقارير بعد" sub="ارفع ملف Excel من التأمينات الاجتماعية للبدء" />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-[11px] text-slate-500">التقرير</th>
                    <th className="px-4 py-3 text-right text-[11px] text-slate-500">الشركة</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">الموظفون</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">نسبة التوطين</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">الحالة</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {reports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{r.report_label || r.source_filename || "تقرير"}</p>
                        {r.report_date && <p className="text-[11px] text-slate-400">{r.report_date}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{r.company_name}</td>
                      <td className="px-4 py-3 text-center text-slate-700">
                        {r.summary ? r.summary.total : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.summary ? (
                          <span className={`text-base font-black ${pctColor(r.summary.saudization_pct)}`}>
                            {r.summary.saudization_pct?.toFixed(1)}%
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <StatusIcon s={r.processing_status} />
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_BADGE[r.processing_status] || STATUS_BADGE.uploaded}`}>
                            {STATUS_LABEL[r.processing_status] || r.processing_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.processing_status === "extracted" && (
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <Eye size={12} /> عرض البيانات
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Analysis Tab ─────────────────────────────────────────────────────── */}
      {tab === "analysis" && (
        <div className="space-y-5">
          {/* Create analysis card */}
          {!selectedAnalysis && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-bold text-slate-700">إنشاء تحليل جديد</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-48">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">قرار التوطين</label>
                  <select
                    value={analysisDec}
                    onChange={(e) => setAnalysisDec(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
                    dir="rtl"
                  >
                    <option value="">اختر القرار</option>
                    {decisions.filter((d) => d.processing_status === "extracted").map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.decision_title || d.decision_number || d.source_filename} — {d.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-48">
                  <label className="mb-1 block text-[11px] font-semibold text-slate-500">تقرير التأمينات</label>
                  <select
                    value={analysisRep}
                    onChange={(e) => setAnalysisRep(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
                    dir="rtl"
                  >
                    <option value="">اختر التقرير</option>
                    {reports.filter((r) => r.processing_status === "extracted").map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.report_label || r.source_filename} — {r.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={createAnalysis}
                  disabled={creatingAnalysis || !analysisDec || !analysisRep}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {creatingAnalysis ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                  إنشاء التحليل
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                يظهر فقط القرارات والتقارير المكتملة المعالجة. تأكد من رفع الملفات في التبويبات السابقة.
              </p>
            </div>
          )}

          {/* Previous analyses */}
          {!selectedAnalysis && analyses.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-sm font-bold text-slate-700">التحليلات السابقة</p>
              </div>
              <div className="divide-y divide-slate-50">
                {analyses.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60">
                    <div>
                      <p className="text-[13px] font-medium text-slate-800">
                        تحليل بتاريخ {fmtDate(a.id)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        التوطين الحالي: {a.current_pct?.toFixed(1) ?? "—"}% | الهدف: {a.target_pct?.toFixed(1) ?? "—"}%
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const full = await api.get<Analysis>(`/recruiter/saudization/analyses/${a.id}`);
                        setSelectedAnalysis(full);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      <ChevronRight size={13} /> عرض
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active analysis dashboard */}
          {selectedAnalysis && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  <ChevronRight size={13} className="rotate-180" /> رجوع
                </button>
                <p className="text-sm font-bold text-slate-700">لوحة تحليل التوطين</p>
              </div>
              <AnalysisDashboard
                analysis={selectedAnalysis}
                onRequestAI={() => requestAI(selectedAnalysis.id)}
              />
            </div>
          )}

          {analysesLoading && !selectedAnalysis && (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
          )}

          {!analysesLoading && analyses.length === 0 && !selectedAnalysis && (
            <EmptyState
              icon={<BarChart3 size={24} />}
              title="لا توجد تحليلات بعد"
              sub="أنشئ تحليلاً جديداً بربط قرار توطين مع تقرير GOSI"
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showCompanyModal && (
        <CompanyModal
          companies={companies}
          onAdd={addCompany}
          onClose={() => setShowCompanyModal(false)}
        />
      )}
      {selectedDecision && (
        <ProfessionsModal decision={selectedDecision} onClose={() => setSelectedDecision(null)} />
      )}
      {selectedReport && (
        <EmployeesModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </div>
  );
}

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">{icon}</div>
      <p className="font-semibold text-slate-600">{title}</p>
      <p className="text-[12px] text-slate-400">{sub}</p>
    </div>
  );
}
