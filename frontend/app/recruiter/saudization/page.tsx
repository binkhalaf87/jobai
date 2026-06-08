"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  Building2, Upload, FileSpreadsheet, BarChart3, Plus, Eye, Loader2,
  CheckCircle, AlertCircle, Clock, Sparkles, ChevronRight, X,
  TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Printer,
  Download, Users, ShieldCheck, ShieldAlert, ArrowUpRight,
} from "lucide-react";

import { api } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type Company = { id: string; name: string; cr_number: string | null };

type Profession = {
  name: string;
  target_percentage: number;
  min_employees?: number;
  min_salary?: number | null;
  calculation_method?: string | null;
  notes?: string | null;
};

type Decision = {
  id: string;
  company_id: string | null;
  company_name: string | null;
  source_filename: string | null;
  decision_number: string | null;
  decision_date: string | null;
  decision_title: string | null;
  issuing_authority: string | null;
  decision_definition: string | null;
  general_notes: string | null;
  targeted_professions: Profession[] | null;
  processing_status: string;
  created_at: string;
};

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

type ActiveSector = {
  profession: string; decision_number: string | null;
  status: "compliant" | "violation" | "below_limit";
  current_count: number; current_saudi: number; current_non_saudi: number;
  current_pct: number; target_pct: number; min_employees: number;
  gap_pct: number; needed: number; notes: string | null;
};

type FutureSector = {
  profession: string; decision_number: string | null;
  target_pct: number; min_employees: number; notes: string | null;
};

type ProfessionGap = {
  profession: string; current_count: number; current_saudi: number;
  current_pct: number; target_pct: number; gap_pct: number;
  needed: number; status?: string; notes: string | null;
};

type Analysis = {
  id: string; decision_id: string; decision_ids?: string[] | null;
  report_id: string;
  current_pct: number | null; target_pct: number | null; gap_pct: number | null;
  profession_gaps: ProfessionGap[] | null;
  active_sectors?: ActiveSector[] | null;
  future_sectors?: FutureSector[] | null;
  compliant_count?: number | null;
  violation_count?: number | null;
  below_limit_count?: number | null;
  active_sector_count?: number | null;
  unclassified_total?: number | null;
  unclassified_saudi?: number | null;
  ai_status: string; ai_recommendations: string | null;
  decision?: Decision; report?: Report;
};

// ── Constants ──────────────────────────────────────────────────────────────────

const PROC_BADGE: Record<string, string> = {
  uploaded:   "bg-slate-100 text-slate-600",
  processing: "bg-amber-100 text-amber-700",
  extracted:  "bg-emerald-100 text-emerald-700",
  failed:     "bg-rose-100 text-rose-700",
};

const PROC_LABEL: Record<string, string> = {
  uploaded: "مُحمَّل", processing: "جارٍ المعالجة...", extracted: "مكتمل", failed: "فشل",
};

const SEC_LABEL: Record<string, string> = {
  compliant: "مُلزَم", violation: "مخالفة", below_limit: "أقل من الحد",
};

const SEC_CLR: Record<string, { bg: string; text: string; ring: string; bar: string }> = {
  compliant:   { bg: "bg-emerald-500/20", text: "text-emerald-400", ring: "ring-1 ring-emerald-500/30", bar: "bg-emerald-500" },
  violation:   { bg: "bg-rose-500/20",    text: "text-rose-400",    ring: "ring-1 ring-rose-500/30",    bar: "bg-rose-500"    },
  below_limit: { bg: "bg-amber-500/20",   text: "text-amber-400",   ring: "ring-1 ring-amber-500/30",   bar: "bg-amber-500"   },
};

// ── Utils ──────────────────────────────────────────────────────────────────────

function pctColor(p: number) {
  return p >= 70 ? "text-emerald-700" : p >= 40 ? "text-amber-700" : "text-rose-600";
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("ar-SA"); } catch { return iso; }
}
function StatusIcon({ s }: { s: string }) {
  if (s === "extracted")  return <CheckCircle size={13} className="text-emerald-600" />;
  if (s === "failed")     return <AlertCircle  size={13} className="text-rose-500" />;
  if (s === "processing") return <Loader2      size={13} className="animate-spin text-amber-600" />;
  return <Clock size={13} className="text-slate-400" />;
}

// ── SVG Compliance Gauge ───────────────────────────────────────────────────────

function ComplianceGauge({ pct, target }: { pct: number; target: number }) {
  const r = 72; const cx = 90; const cy = 92; const sweep = 210;
  const startDeg = 180 + (180 - sweep) / 2;

  function pt(deg: number, rad: number) {
    const a = (deg * Math.PI) / 180;
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  }
  function arc(from: number, to: number, radius: number) {
    const s = pt(from, radius), e = pt(to, radius);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  const fillEnd  = startDeg + (Math.min(pct, 100) / 100) * sweep;
  const tgtAngle = startDeg + (Math.min(target, 100) / 100) * sweep;
  const gauge    = pct >= target ? "#22c55e" : pct >= target * 0.6 ? "#f59e0b" : "#ef4444";

  return (
    <svg viewBox="0 0 180 140" className="w-44 h-32">
      <path d={arc(startDeg, startDeg + sweep, r)} fill="none" stroke="#1e293b" strokeWidth="13" strokeLinecap="round" />
      {pct > 0 && (
        <path d={arc(startDeg, fillEnd, r)} fill="none" stroke={gauge} strokeWidth="13" strokeLinecap="round" />
      )}
      {target > 0 && (
        <line
          x1={pt(tgtAngle, r - 9).x} y1={pt(tgtAngle, r - 9).y}
          x2={pt(tgtAngle, r + 9).x} y2={pt(tgtAngle, r + 9).y}
          stroke="#818cf8" strokeWidth="3" strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">{pct.toFixed(0)}%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#94a3b8" fontSize="9">نسبة التوطين</text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#818cf8" fontSize="9">هدف {target.toFixed(0)}%</text>
    </svg>
  );
}

// ── Dark KPI Card ──────────────────────────────────────────────────────────────

function DarkKPI({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[#1a1f2e] p-3">
      <div className={`${color} opacity-70`}>{icon}</div>
      <div className="min-w-0">
        <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ── Sector Card ────────────────────────────────────────────────────────────────

function SectorCard({ sector }: { sector: ActiveSector }) {
  const [expanded, setExpanded] = useState(false);
  const [simDelta, setSimDelta] = useState(0);

  const sc      = SEC_CLR[sector.status] || SEC_CLR.violation;
  const maxSim  = Math.max(10, sector.needed + 8);
  const simPct  = sector.current_count > 0
    ? ((sector.current_saudi + simDelta) / sector.current_count) * 100
    : 0;
  const simOk   = simPct >= sector.target_pct;

  return (
    <div className={`rounded-xl ${sc.ring} bg-[#1a1f2e] p-4 space-y-3`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-bold leading-snug text-white">{sector.profession}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${sc.bg} ${sc.text}`}>
          {SEC_LABEL[sector.status] || sector.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "الإجمالي",    val: sector.current_count,     cls: "text-slate-300"  },
          { label: "سعودي",       val: sector.current_saudi,     cls: "text-emerald-400"},
          { label: "غير سعودي",   val: sector.current_non_saudi, cls: "text-slate-400"  },
        ].map(({ label, val, cls }) => (
          <div key={label} className="rounded-lg bg-slate-800/60 py-2">
            <p className={`text-base font-bold ${cls}`}>{val}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">نسبة التوطين</span>
          <span className={`font-bold ${sc.text}`}>
            {sector.current_pct.toFixed(0)}% / {sector.target_pct.toFixed(0)}%
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className={`absolute inset-y-0 right-0 rounded-full ${sc.bar}`}
            style={{ width: `${Math.min(sector.current_pct, 100)}%` }}
          />
          <div
            className="absolute inset-y-0 w-0.5 bg-indigo-400"
            style={{ right: `${Math.min(sector.target_pct, 100)}%` }}
          />
        </div>
        {sector.needed > 0 && (
          <p className="mt-1 text-[11px] text-rose-400">
            يحتاج {sector.needed} سعودي للامتثال
          </p>
        )}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-700/60 py-1.5 text-[11px] font-semibold text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-200"
      >
        <ArrowUpRight size={11} />
        محاكاة التعيين
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {expanded && (
        <div className="space-y-2 rounded-lg bg-slate-800/60 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>إضافة سعوديين</span>
            <span className="font-bold text-white">+{simDelta}</span>
          </div>
          <input
            type="range" min={0} max={maxSim} value={simDelta}
            onChange={(e) => setSimDelta(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">النسبة بعد التعيين</span>
            <span className={`font-bold ${simOk ? "text-emerald-400" : "text-rose-400"}`}>
              {simPct.toFixed(1)}%{simOk ? "  ✓ مُلزَم" : ""}
            </span>
          </div>
          <button onClick={() => setSimDelta(0)} className="text-[10px] text-slate-500 hover:text-slate-300">
            إعادة التعيين
          </button>
        </div>
      )}
    </div>
  );
}

// ── Analysis Dashboard (dark) ──────────────────────────────────────────────────

type FilterType = "all" | "compliant" | "violation" | "below_limit";

function AnalysisDashboard({ analysis, onRequestAI }: { analysis: Analysis; onRequestAI: () => Promise<void> }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [filter, setFilter]       = useState<FilterType>("all");
  const [showFuture, setShowFuture] = useState(false);

  const sectors      = analysis.active_sectors || [];
  const future       = analysis.future_sectors  || [];
  const currentPct   = analysis.current_pct  ?? 0;
  const targetPct    = analysis.target_pct   ?? 0;
  const gapPct       = analysis.gap_pct      ?? 0;
  const summary      = analysis.report?.summary;
  const totalEmps    = summary?.total      ?? 0;
  const saudiCount   = summary?.saudi_count ?? 0;
  const compliant    = analysis.compliant_count    ?? sectors.filter((s) => s.status === "compliant").length;
  const violation    = analysis.violation_count    ?? sectors.filter((s) => s.status === "violation").length;
  const belowLimit   = analysis.below_limit_count  ?? sectors.filter((s) => s.status === "below_limit").length;

  const filtered = useMemo(() =>
    filter === "all" ? sectors : sectors.filter((s) => s.status === filter),
    [sectors, filter]
  );

  async function handleAI() {
    setAiLoading(true);
    try { await onRequestAI(); } finally { setAiLoading(false); }
  }

  function exportCSV() {
    const header = ["المهنة","رقم القرار","الحالة","الإجمالي","السعوديون","غير السعوديين","الحالي%","الهدف%","الفجوة%","المطلوب"];
    const rows   = sectors.map((s) => [
      s.profession, s.decision_number || "", SEC_LABEL[s.status] || s.status,
      s.current_count, s.current_saudi, s.current_non_saudi,
      s.current_pct.toFixed(1), s.target_pct.toFixed(1), s.gap_pct.toFixed(1), s.needed,
    ]);
    const csv  = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "saudization_analysis.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl bg-[#0f1117] p-5 space-y-5 text-white print:bg-white print:text-black" dir="rtl">

      {/* Alert banner */}
      {violation > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
          <AlertTriangle size={16} className="shrink-0 text-rose-400" />
          <p className="text-[13px] text-rose-300">
            تنبيه: <strong>{violation}</strong> قطاع{violation !== 1 ? "ات" : ""} من أصل {sectors.length} تعاني من مخالفات في نسبة التوطين
          </p>
        </div>
      )}

      {/* Gauge + KPIs */}
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-[#1a1f2e] px-6 py-4">
          <ComplianceGauge pct={currentPct} target={targetPct} />
          <p className="mt-1 text-[11px] text-slate-500">
            {gapPct > 0 ? `فجوة ${gapPct.toFixed(1)}%` : "تجاوز الهدف ✓"}
          </p>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
          <DarkKPI label="إجمالي الموظفين" value={String(totalEmps)}           icon={<Users      size={14}/>} color="text-slate-300"  />
          <DarkKPI label="السعوديون"        value={String(saudiCount)}          icon={<ShieldCheck size={14}/>} color="text-emerald-400"/>
          <DarkKPI label="التوطين الحالي"   value={`${currentPct.toFixed(1)}%`} icon={<TrendingUp size={14}/>} color={currentPct >= targetPct ? "text-emerald-400" : "text-rose-400"}/>
          <DarkKPI label="مُلزَم"            value={String(compliant)}           icon={<CheckCircle size={14}/>} color="text-emerald-400"/>
          <DarkKPI label="مخالفة"           value={String(violation)}           icon={<ShieldAlert size={14}/>} color="text-rose-400"   />
          <DarkKPI label="أقل من الحد"      value={String(belowLimit)}          icon={<AlertCircle size={14}/>} color="text-amber-400"  />
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {(["all","compliant","violation","below_limit"] as FilterType[]).map((f) => {
            const labels = { all:"الكل", compliant:"مُلزَم", violation:"مخالفة", below_limit:"أقل من الحد" };
            const act = {
              all:         "bg-slate-500 text-white border-slate-500",
              compliant:   "bg-emerald-500 text-white border-emerald-500",
              violation:   "bg-rose-500 text-white border-rose-500",
              below_limit: "bg-amber-500 text-white border-amber-500",
            };
            const def = {
              all:         "border-slate-600 bg-slate-800/60 text-slate-400 hover:text-slate-200",
              compliant:   "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
              violation:   "border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
              below_limit: "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${filter === f ? act[f] : def[f]}`}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            <Download size={11} /> تصدير CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
          >
            <Printer size={11} /> طباعة
          </button>
        </div>
      </div>

      {/* Active sectors */}
      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
          القطاعات النشطة ({filtered.length})
        </p>
        {filtered.length === 0 ? (
          <p className="rounded-xl bg-[#1a1f2e] py-8 text-center text-[13px] text-slate-500">
            لا توجد قطاعات بهذا الفلتر
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s, i) => <SectorCard key={i} sector={s} />)}
          </div>
        )}
      </div>

      {/* Future sectors */}
      {future.length > 0 && (
        <div>
          <button
            onClick={() => setShowFuture(!showFuture)}
            className="flex items-center gap-2 text-[12px] font-semibold text-slate-500 transition-colors hover:text-slate-200"
          >
            {showFuture ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
            القطاعات المستقبلية ({future.length}) — لا يوجد موظفون حالياً
          </button>
          {showFuture && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {future.map((s, i) => (
                <div key={i} className="rounded-xl border border-slate-700/40 bg-[#1a1f2e] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-slate-300">{s.profession}</p>
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400">مستقبلي</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    الهدف: <span className="font-semibold text-indigo-400">{s.target_pct.toFixed(0)}%</span>
                  </p>
                  {s.notes && <p className="mt-1 text-[10px] text-slate-600">{s.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Recommendations */}
      <div className="rounded-xl border border-slate-700/50 bg-[#1a1f2e] p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[13px] font-bold text-white">
            <Sparkles size={14} className="text-indigo-400" />
            توصيات الذكاء الاصطناعي
          </p>
          {analysis.ai_status !== "completed" && (
            <button
              onClick={handleAI}
              disabled={aiLoading || analysis.ai_status === "pending"}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {aiLoading || analysis.ai_status === "pending"
                ? <><Loader2 size={11} className="animate-spin"/> جارٍ التوليد...</>
                : <><Sparkles size={11}/> توليد التوصيات</>}
            </button>
          )}
        </div>

        {analysis.ai_status === "completed" && analysis.ai_recommendations ? (
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-300">
            {analysis.ai_recommendations}
          </p>
        ) : analysis.ai_status === "failed" ? (
          <p className="text-[12px] text-rose-400">فشل توليد التوصيات. حاول مجدداً.</p>
        ) : (
          <p className="text-[12px] text-slate-500">
            اضغط &quot;توليد التوصيات&quot; للحصول على تحليل تفصيلي من الذكاء الاصطناعي.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Company Modal ─────────────────────────────────────────────────────────────

function CompanyModal({
  companies, onAdd, onClose,
}: { companies: Company[]; onAdd: (name: string, cr: string) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [cr,   setCr]   = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try { await onAdd(name.trim(), cr.trim()); setName(""); setCr(""); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">إدارة الشركات</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16}/></button>
        </div>
        <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
          {companies.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Building2 size={14} className="text-slate-400"/>
              <span className="flex-1 text-sm font-medium text-slate-800">{c.name}</span>
              {c.cr_number && <span className="text-[11px] text-slate-400">{c.cr_number}</span>}
            </div>
          ))}
          {companies.length === 0 && (
            <p className="py-2 text-center text-sm text-slate-400">لا توجد شركات بعد</p>
          )}
        </div>
        <div className="space-y-2 border-t pt-4">
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="اسم الشركة *"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            dir="rtl"
          />
          <input
            value={cr} onChange={(e) => setCr(e.target.value)}
            placeholder="رقم السجل التجاري (اختياري)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            dir="rtl"
          />
          <button
            onClick={handleAdd}
            disabled={busy || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? <Loader2 size={14} className="animate-spin"/> : <Plus size={14}/>}
            إضافة شركة
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Decision Accordion (inline, replaces modal) ───────────────────────────────

function DecisionAccordion({ decision }: { decision: Decision }) {
  const profs = decision.targeted_professions || [];

  return (
    <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4" dir="rtl">
      <div className="mx-auto max-w-4xl space-y-4">

        {/* Header info row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "الجهة المُصدِرة", value: decision.issuing_authority },
            { label: "رقم القرار",      value: decision.decision_number   },
            { label: "تاريخ القرار",    value: decision.decision_date     },
            { label: "المهن المُلزَمة",  value: `${profs.length} مهنة`    },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-white border border-slate-100 px-3 py-2">
              <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
              <p className="text-[12px] font-semibold text-slate-800 leading-snug">{value || "—"}</p>
            </div>
          ))}
        </div>

        {/* Decision definition */}
        {decision.decision_definition && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-600">تعريف القرار وأحكامه</p>
            <p className="text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap">
              {decision.decision_definition}
            </p>
          </div>
        )}

        {/* Professions table */}
        {profs.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-slate-400">لا توجد مهن مستخرجة</p>
        ) : (
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">المهن المستهدفة بالتوطين</p>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-slate-500">المهنة / النشاط</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-500">هدف %</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-500">الحد الأدنى</th>
                      <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-500">أدنى راتب</th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-slate-500">طريقة الاحتساب</th>
                      <th className="px-3 py-2.5 text-right text-[11px] font-semibold text-slate-500">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {profs.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-3 py-3 font-medium text-slate-800 max-w-[180px]" dir="rtl">{p.name}</td>
                        <td className={`px-3 py-3 text-center text-base font-black ${pctColor(p.target_percentage)}`}>
                          {p.target_percentage?.toFixed(0) ?? "—"}%
                        </td>
                        <td className="px-3 py-3 text-center text-[12px] text-slate-600">
                          {p.min_employees ?? 1} موظف
                        </td>
                        <td className="px-3 py-3 text-center text-[12px] text-slate-600">
                          {p.min_salary ? `${p.min_salary.toLocaleString()} ر.س` : "—"}
                        </td>
                        <td className="px-3 py-3 text-[12px] text-slate-600 max-w-[220px]" dir="rtl">
                          {p.calculation_method || "—"}
                        </td>
                        <td className="px-3 py-3 text-[12px] text-slate-500 max-w-[180px]" dir="rtl">
                          {p.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* General notes */}
        {decision.general_notes && (
          <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600">أحكام عامة وملاحظات</p>
            <p className="text-[12px] leading-relaxed text-slate-700 whitespace-pre-wrap">
              {decision.general_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Report Summary Modal ───────────────────────────────────────────────────────

function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const summary = report.summary;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">ملخص التقرير</h3>
            <p className="text-[12px] text-slate-400">{report.source_filename}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100"><X size={16}/></button>
        </div>
        {summary ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "الإجمالي",     value: summary.total,                            cls: "text-slate-800" },
                { label: "السعوديون",    value: summary.saudi_count,                      cls: "text-emerald-700" },
                { label: "غير السعوديين",value: summary.non_saudi_count,                  cls: "text-slate-600" },
                { label: "نسبة التوطين",  value: `${summary.saudization_pct?.toFixed(1)}%`, cls: pctColor(summary.saudization_pct) },
              ].map(({ label, value, cls }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className={`text-xl font-bold ${cls}`}>{value}</p>
                  <p className="text-[11px] text-slate-500">{label}</p>
                </div>
              ))}
            </div>
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
          <p className="py-6 text-center text-sm text-slate-400">لا تتوفر بيانات ملخص</p>
        )}
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">{icon}</div>
      <p className="font-semibold text-slate-600">{title}</p>
      <p className="text-[12px] text-slate-400">{sub}</p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type Tab = "decisions" | "reports" | "analysis";

export default function SaudizationPage() {
  const [tab, setTab] = useState<Tab>("decisions");

  // Data
  const [companies,        setCompanies]        = useState<Company[]>([]);
  const [decisions,        setDecisions]        = useState<Decision[]>([]);
  const [reports,          setReports]          = useState<Report[]>([]);
  const [analyses,         setAnalyses]         = useState<Analysis[]>([]);

  // UI state
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [decisionsLoading, setDecisionsLoading] = useState(true);
  const [reportsLoading,   setReportsLoading]   = useState(true);
  const [analysesLoading,  setAnalysesLoading]  = useState(true);

  // Decisions upload
  const [uploadingDecision,  setUploadingDecision]  = useState(false);
  const [expandedDecisionId, setExpandedDecisionId] = useState<string | null>(null);
  const decisionFileRef = useRef<HTMLInputElement>(null);

  // Reports upload
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reportCompany,   setReportCompany]   = useState("");
  const [reportDate,      setReportDate]      = useState("");
  const [reportLabel,     setReportLabel]     = useState("");
  const [selectedReport,  setSelectedReport]  = useState<Report | null>(null);
  const [uploadError,     setUploadError]     = useState<string[]>([]);
  const reportFileRef = useRef<HTMLInputElement>(null);

  // Analysis
  const [selectedAnalysis,  setSelectedAnalysis]  = useState<Analysis | null>(null);
  const [selectedDecIds,    setSelectedDecIds]    = useState<string[]>([]);
  const [analysisRep,       setAnalysisRep]       = useState("");
  const [creatingAnalysis,  setCreatingAnalysis]  = useState(false);

  // Polling
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadCompanies();
    loadDecisions();
    loadReports();
    loadAnalyses();
  }, []);

  useEffect(() => {
    const hasProcessing =
      decisions.some((d) => d.processing_status === "processing" || d.processing_status === "uploaded") ||
      reports.some((r)   => r.processing_status === "processing" || r.processing_status === "uploaded");
    if (hasProcessing) {
      pollingRef.current = setTimeout(() => { loadDecisions(); loadReports(); }, 3000);
    }
    return () => { if (pollingRef.current) clearTimeout(pollingRef.current); };
  }, [decisions, reports]);

  async function loadCompanies() {
    try { setCompanies(await api.get<Company[]>("/recruiter/saudization/companies")); } catch {}
  }
  async function loadDecisions() {
    try { setDecisions(await api.get<Decision[]>("/recruiter/saudization/decisions")); }
    catch {} finally { setDecisionsLoading(false); }
  }
  async function loadReports() {
    try { setReports(await api.get<Report[]>("/recruiter/saudization/reports")); }
    catch {} finally { setReportsLoading(false); }
  }
  async function loadAnalyses() {
    try { setAnalyses(await api.get<Analysis[]>("/recruiter/saudization/analyses")); }
    catch {} finally { setAnalysesLoading(false); }
  }

  async function addCompany(name: string, cr: string) {
    const c = await api.post<Company>("/recruiter/saudization/companies", { name, cr_number: cr || null });
    setCompanies((p) => [c, ...p]);
  }

  async function uploadDecision(file: File) {
    setUploadingDecision(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const d = await api.post<Decision>("/recruiter/saudization/decisions/upload", fd);
      setDecisions((p) => [d, ...p]);
    } catch (e: any) {
      alert(e?.message || "حدث خطأ أثناء رفع الملف");
    } finally {
      setUploadingDecision(false);
      if (decisionFileRef.current) decisionFileRef.current.value = "";
    }
  }

  async function uploadReport(file: File) {
    if (!reportCompany) { alert("اختر الشركة أولاً"); return; }
    setUploadError([]);
    setUploadingReport(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("company_id", reportCompany);
      if (reportDate)  fd.append("report_date",  reportDate);
      if (reportLabel) fd.append("report_label", reportLabel);
      const r = await api.post<Report>("/recruiter/saudization/reports/upload", fd);
      setReports((p) => [r, ...p]);
    } catch (e: any) {
      const detail = e?.detail;
      if (detail?.errors) {
        setUploadError(detail.errors);
      } else {
        setUploadError([e?.message || "حدث خطأ أثناء رفع الملف"]);
      }
    } finally {
      setUploadingReport(false);
      if (reportFileRef.current) reportFileRef.current.value = "";
    }
  }

  async function createAnalysis() {
    if (selectedDecIds.length === 0 || !analysisRep) { alert("اختر قرار واحد على الأقل والتقرير"); return; }
    setCreatingAnalysis(true);
    try {
      const a = await api.post<Analysis>("/recruiter/saudization/analyses", {
        decision_ids: selectedDecIds,
        report_id:    analysisRep,
      });
      setAnalyses((p) => [a, ...p]);
      const full = await api.get<Analysis>(`/recruiter/saudization/analyses/${a.id}`);
      setSelectedAnalysis(full);
    } catch (e: any) {
      alert(e?.message || "تأكد أن القرارات والتقرير اكتملت معالجتها");
    } finally {
      setCreatingAnalysis(false);
    }
  }

  async function requestAI(analysisId: string) {
    await api.post<Analysis>(`/recruiter/saudization/analyses/${analysisId}/ai`, {});
    let tries = 0;
    while (tries < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      const updated = await api.get<Analysis>(`/recruiter/saudization/analyses/${analysisId}`);
      if (updated.ai_status !== "pending") { setSelectedAnalysis(updated); break; }
      tries++;
    }
  }

  function toggleDecId(id: string) {
    setSelectedDecIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  const readyDecisions = decisions.filter((d) => d.processing_status === "extracted");
  const readyReports   = reports.filter((r)   => r.processing_status === "extracted");

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">أداة التوطين</h1>
          <p className="text-[13px] text-slate-500">قرارات التوطين • تقارير GOSI • تحليل الفجوات والداشبورد</p>
        </div>
        <button
          onClick={() => setShowCompanyModal(true)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <Building2 size={13}/>
          الشركات ({companies.length})
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {([
          { id: "decisions", label: "قرارات التوطين",     icon: <Upload         size={13}/> },
          { id: "reports",   label: "تقارير التأمينات",   icon: <FileSpreadsheet size={13}/> },
          { id: "analysis",  label: "التحليل والداشبورد", icon: <BarChart3      size={13}/> },
        ] as { id: Tab; label: string; icon: React.ReactNode }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition-all",
              tab === t.id ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50",
            ].join(" ")}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Decisions Tab ───────────────────────────────────────────────────── */}
      {tab === "decisions" && (
        <div className="space-y-4">
          {/* Upload card — no company required */}
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <p className="mb-1 text-sm font-bold text-slate-700">رفع قرار توطين (PDF)</p>
            <p className="mb-3 text-[12px] text-slate-400">
              قرارات التوطين تنطبق على جميع الشركات — لا يلزم تحديد شركة عند الرفع
            </p>
            <div className="flex items-center gap-3">
              <input
                ref={decisionFileRef} type="file" accept=".pdf" className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadDecision(e.target.files[0])}
              />
              <button
                onClick={() => decisionFileRef.current?.click()}
                disabled={uploadingDecision}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {uploadingDecision ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
                رفع ملف PDF
              </button>
              {uploadingDecision && (
                <p className="text-[12px] text-slate-500">جارٍ الرفع... سيبدأ الاستخراج تلقائياً</p>
              )}
            </div>
          </div>

          {decisionsLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400"/></div>
          ) : decisions.length === 0 ? (
            <EmptyState icon={<Upload size={24}/>} title="لا توجد قرارات بعد" sub="ارفع ملف PDF لقرار التوطين للبدء"/>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              {decisions.map((d, idx) => (
                <div key={d.id} className={idx > 0 ? "border-t border-slate-100" : ""}>
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/40">
                    {/* Status icon */}
                    <StatusIcon s={d.processing_status}/>

                    {/* Main info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-slate-800">
                        {d.decision_title || d.decision_number || d.source_filename || "قرار غير مُعنوَن"}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                        {d.decision_number && (
                          <span className="text-[11px] text-slate-400">رقم: {d.decision_number}</span>
                        )}
                        {d.decision_date && (
                          <span className="text-[11px] text-slate-400">{d.decision_date}</span>
                        )}
                        {d.issuing_authority && (
                          <span className="text-[11px] text-slate-400">{d.issuing_authority}</span>
                        )}
                        {d.targeted_professions?.length ? (
                          <span className="text-[11px] text-brand-600 font-medium">{d.targeted_professions.length} مهنة</span>
                        ) : null}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PROC_BADGE[d.processing_status] || PROC_BADGE.uploaded}`}>
                      {PROC_LABEL[d.processing_status] || d.processing_status}
                    </span>

                    {/* Expand button */}
                    {d.processing_status === "extracted" && (
                      <button
                        onClick={() => setExpandedDecisionId(expandedDecisionId === d.id ? null : d.id)}
                        className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
                      >
                        <Eye size={12}/>
                        {expandedDecisionId === d.id ? "إغلاق" : "عرض التفاصيل"}
                        {expandedDecisionId === d.id
                          ? <ChevronUp size={11}/>
                          : <ChevronDown size={11}/>}
                      </button>
                    )}
                  </div>

                  {/* Inline accordion */}
                  {expandedDecisionId === d.id && <DecisionAccordion decision={d}/>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reports Tab ─────────────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5">
            <p className="mb-3 text-sm font-bold text-slate-700">رفع تقرير GOSI (Excel)</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-40 flex-1">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">الشركة *</label>
                <select
                  value={reportCompany} onChange={(e) => setReportCompany(e.target.value)}
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
                  type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
              <div className="min-w-32 flex-1">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">تسمية التقرير</label>
                <input
                  value={reportLabel} onChange={(e) => setReportLabel(e.target.value)}
                  placeholder="مثال: يونيو 2025"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                  dir="rtl"
                />
              </div>
              <input
                ref={reportFileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { setUploadError([]); e.target.files?.[0] && uploadReport(e.target.files[0]); }}
              />
              <button
                onClick={() => reportFileRef.current?.click()}
                disabled={uploadingReport || !reportCompany}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {uploadingReport ? <Loader2 size={14} className="animate-spin"/> : <Upload size={14}/>}
                رفع Excel
              </button>
            </div>
            {uploadError.length > 0 && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="mb-1.5 text-[12px] font-bold text-rose-700">أخطاء في التحقق من الملف:</p>
                {uploadError.map((e, i) => (
                  <p key={i} className="text-[12px] text-rose-600">• {e}</p>
                ))}
              </div>
            )}
          </div>

          {reportsLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400"/></div>
          ) : reports.length === 0 ? (
            <EmptyState icon={<FileSpreadsheet size={24}/>} title="لا توجد تقارير بعد" sub="ارفع ملف Excel من التأمينات الاجتماعية"/>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-[11px] text-slate-500">التقرير</th>
                    <th className="px-4 py-3 text-right text-[11px] text-slate-500">الشركة</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">الموظفون</th>
                    <th className="px-4 py-3 text-center text-[11px] text-slate-500">التوطين</th>
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
                      <td className="px-4 py-3 text-center text-slate-700">{r.summary?.total ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {r.summary
                          ? <span className={`text-base font-black ${pctColor(r.summary.saudization_pct)}`}>{r.summary.saudization_pct?.toFixed(1)}%</span>
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <StatusIcon s={r.processing_status}/>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${PROC_BADGE[r.processing_status] || PROC_BADGE.uploaded}`}>
                            {PROC_LABEL[r.processing_status] || r.processing_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.processing_status === "extracted" && (
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            <Eye size={12}/> عرض البيانات
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

      {/* ── Analysis Tab ────────────────────────────────────────────────────── */}
      {tab === "analysis" && (
        <div className="space-y-5">

          {/* Create analysis */}
          {!selectedAnalysis && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-bold text-slate-700">إنشاء تحليل جديد</p>

              {/* Multi-decision checkboxes */}
              <div className="mb-4">
                <label className="mb-2 block text-[11px] font-semibold text-slate-500">
                  قرارات التوطين * (يمكن اختيار أكثر من قرار)
                </label>
                {readyDecisions.length === 0 ? (
                  <p className="text-[12px] text-slate-400">لا توجد قرارات مكتملة بعد</p>
                ) : (
                  <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-xl border border-slate-100 p-2">
                    {readyDecisions.map((d) => (
                      <label key={d.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedDecIds.includes(d.id)}
                          onChange={() => toggleDecId(d.id)}
                          className="h-3.5 w-3.5 accent-brand-600"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-slate-800">
                            {d.decision_title || d.decision_number || d.source_filename}
                          </p>
                          <p className="text-[11px] text-slate-400">{d.company_name}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {selectedDecIds.length > 0 && (
                  <p className="mt-1.5 text-[11px] text-brand-600">تم اختيار {selectedDecIds.length} قرار</p>
                )}
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-[11px] font-semibold text-slate-500">تقرير التأمينات *</label>
                <select
                  value={analysisRep} onChange={(e) => setAnalysisRep(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-brand-400 focus:outline-none"
                  dir="rtl"
                >
                  <option value="">اختر التقرير</option>
                  {readyReports.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.report_label || r.source_filename} — {r.company_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={createAnalysis}
                disabled={creatingAnalysis || selectedDecIds.length === 0 || !analysisRep}
                className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {creatingAnalysis ? <Loader2 size={14} className="animate-spin"/> : <BarChart3 size={14}/>}
                إنشاء التحليل
              </button>
              <p className="mt-2 text-[11px] text-slate-400">
                يظهر فقط القرارات والتقارير المكتملة المعالجة.
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
                        {a.decision?.decision_title || a.decision?.decision_number || "تحليل"} — {a.report?.report_label || "تقرير"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        التوطين: {a.current_pct?.toFixed(1) ?? "—"}% | هدف: {a.target_pct?.toFixed(1) ?? "—"}%
                        {a.violation_count ? ` | ${a.violation_count} مخالفة` : ""}
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const full = await api.get<Analysis>(`/recruiter/saudization/analyses/${a.id}`);
                        setSelectedAnalysis(full);
                      }}
                      className="flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      <ChevronRight size={13}/> عرض
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active dashboard */}
          {selectedAnalysis && (
            <div>
              <div className="mb-4 flex items-center gap-3">
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="flex items-center gap-1 text-[12px] font-semibold text-slate-500 hover:text-slate-800"
                >
                  <ChevronRight size={13} className="rotate-180"/> رجوع
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
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-slate-400"/></div>
          )}
          {!analysesLoading && analyses.length === 0 && !selectedAnalysis && (
            <EmptyState
              icon={<BarChart3 size={24}/>}
              title="لا توجد تحليلات بعد"
              sub="أنشئ تحليلاً جديداً بربط قرار أو أكثر مع تقرير GOSI"
            />
          )}
        </div>
      )}

      {/* Modals */}
      {showCompanyModal && (
        <CompanyModal companies={companies} onAdd={addCompany} onClose={() => setShowCompanyModal(false)}/>
      )}
      {selectedReport && (
        <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)}/>
      )}
    </div>
  );
}
