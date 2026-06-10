"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Mail,
  Pause,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BarChart2,
  Megaphone,
  Download,
  Upload,
  Users,
  MousePointer,
  Save,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Send,
  Eye,
  Zap,
} from "lucide-react";
import {
  getCampaigns,
  getCampaign,
  pauseCampaign,
  resumeCampaign,
  createCampaign,
  importContacts,
  activateCampaign,
  downloadTemplate,
  getBrevoEmailCampaigns,
  saveOpenersToList,
  type MarketingCampaign,
  type BrevoEmailCampaign,
} from "@/lib/marketing";

/* ─── shared helpers ─────────────────────────────────────────────────── */

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     className: "bg-slate-100 text-slate-600",     icon: Clock },
  active:    { label: "Active",    className: "bg-emerald-100 text-emerald-700", icon: TrendingUp },
  paused:    { label: "Paused",    className: "bg-amber-100 text-amber-700",     icon: Pause },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-700",       icon: CheckCircle },
  error:     { label: "Error",     className: "bg-rose-100 text-rose-700",       icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function StatChip({ icon: Icon, label, value, className = "" }: {
  icon: React.ElementType; label: string; value: string | number; className?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs ${className}`}>
      <Icon size={11} />
      <span className="font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] opacity-70">{label}</span>
    </div>
  );
}

/* ─── save-to-list modal (Brevo) ─────────────────────────────────────── */

function SaveModal({
  campaign,
  onClose,
  onSaved,
}: {
  campaign: BrevoEmailCampaign;
  onClose: () => void;
  onSaved: (result: { list_name: string; added: number }) => void;
}) {
  const [listName, setListName] = useState(`Openers — ${campaign.name.slice(0, 40)}`);
  const [includeClickers, setIncludeClickers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!listName.trim()) return;
    setLoading(true); setError("");
    try {
      const result = await saveOpenersToList(campaign.id, listName.trim(), includeClickers);
      onSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <p className="text-sm font-bold text-slate-900">حفظ النشيطين كقائمة جديدة</p>
        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
          <p>الحملة: <span className="font-semibold">{campaign.name}</span></p>
          <p>
            سيتم حفظ <span className="font-bold text-emerald-700">{campaign.unique_opens.toLocaleString()}</span> ايميل فتحوا الحملة
            {includeClickers && <> + <span className="font-bold text-blue-700">{campaign.unique_clicks.toLocaleString()}</span> ضغطوا على رابط</>}
          </p>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">اسم القائمة</label>
          <input
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
          <input type="checkbox" checked={includeClickers} onChange={(e) => setIncludeClickers(e.target.checked)} className="rounded" />
          أضف أيضاً من ضغط على رابط (Clickers)
        </label>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600">إلغاء</button>
          <button
            onClick={() => void handleSave()}
            disabled={loading || !listName.trim()}
            className="flex-1 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "جاري الحفظ…" : "حفظ القائمة"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-xl">
      <CheckCircle size={16} /> {message}
    </div>
  );
}

/* ─── analytics view ─────────────────────────────────────────────────── */

const WARMUP_INFO = "Days 1–3: 500/day → Days 4–7: 1,000 → Days 8–14: 3,000 → Days 15–21: 8,000 → Days 22–28: 20,000 → Day 29+: 50,000/day";

function AnalyticsView({ onNewCampaign, onSetupCampaign }: { onNewCampaign: () => void; onSetupCampaign: (id: string) => void }) {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [brevoCampaigns, setBrevoCampaigns] = useState<BrevoEmailCampaign[]>([]);
  const [loadingPlatform, setLoadingPlatform] = useState(true);
  const [loadingBrevo, setLoadingBrevo] = useState(true);
  const [errorPlatform, setErrorPlatform] = useState("");
  const [errorBrevo, setErrorBrevo] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [saving, setSaving] = useState<BrevoEmailCampaign | null>(null);
  const [toast, setToast] = useState("");

  async function loadPlatform() {
    setLoadingPlatform(true); setErrorPlatform("");
    try { setCampaigns(await getCampaigns()); }
    catch (e) { setErrorPlatform(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoadingPlatform(false); }
  }

  useEffect(() => {
    void loadPlatform();
    setLoadingBrevo(true);
    getBrevoEmailCampaigns()
      .then(setBrevoCampaigns)
      .catch((e) => setErrorBrevo(e instanceof Error ? e.message : "Failed to load Brevo campaigns"))
      .finally(() => setLoadingBrevo(false));
  }, []);

  async function handlePause(id: string) {
    setActing(id);
    try { setCampaigns((p) => p.map((c) => (c.id === id ? { ...c, status: "paused" } : c))); await pauseCampaign(id); }
    catch { void loadPlatform(); }
    finally { setActing(null); }
  }

  async function handleResume(id: string) {
    setActing(id);
    try { setCampaigns((p) => p.map((c) => (c.id === id ? { ...c, status: "active" } : c))); await resumeCampaign(id); }
    catch { void loadPlatform(); }
    finally { setActing(null); }
  }

  return (
    <div className="space-y-8">
      {/* ── Platform campaigns ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">حملات المنصة</h2>
            <p className="text-xs text-slate-500 mt-0.5">الحملات المُنشأة من خلال المنصة</p>
          </div>
          <button
            onClick={onNewCampaign}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <Plus size={14} /> إنشاء حملة
          </button>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <strong>جدول التسخين التلقائي:</strong> {WARMUP_INFO}
        </div>

        {loadingPlatform && <p className="text-center text-sm text-slate-400 py-8">جاري التحميل…</p>}
        {errorPlatform && <p className="text-center text-sm text-rose-600 py-8">{errorPlatform}</p>}

        {!loadingPlatform && campaigns.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <Mail size={28} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">لا توجد حملات بعد</p>
            <p className="mt-1 text-xs text-slate-400">أنشئ أول حملة تسويقية</p>
            <button onClick={onNewCampaign} className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              <Plus size={14} /> إنشاء حملة
            </button>
          </div>
        )}

        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 truncate">Subject: {c.subject}</p>
                  <p className="text-xs text-slate-400">From: {c.from_name} &lt;{c.from_email}&gt;</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {c.status === "active" && (
                    <button onClick={() => void handlePause(c.id)} disabled={acting === c.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                      Pause
                    </button>
                  )}
                  {c.status === "paused" && (
                    <button onClick={() => void handleResume(c.id)} disabled={acting === c.id}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                      Resume
                    </button>
                  )}
                  {c.status === "draft" && (
                    <button onClick={() => onSetupCampaign(c.id)}
                      className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                      Setup
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3">
                {[
                  { label: "Contacts",    value: c.total_contacts.toLocaleString() },
                  { label: "Sent",        value: c.total_sent.toLocaleString() },
                  { label: "Failed",      value: c.total_failed.toLocaleString() },
                  { label: "Daily limit", value: c.current_daily_limit.toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-base font-bold text-slate-900 tabular-nums">{value}</p>
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {c.total_contacts > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Progress</span><span>{c.progress_pct}%</span>
                  </div>
                  <ProgressBar pct={c.progress_pct} />
                </div>
              )}

              {c.error_message && <p className="mt-2 text-xs text-rose-600">{c.error_message}</p>}
              {c.warmup_start_date && (
                <p className="mt-2 text-xs text-slate-400">
                  Warm-up started: {new Date(c.warmup_start_date).toLocaleDateString()}
                  {c.last_sent_at && ` · Last sent: ${new Date(c.last_sent_at).toLocaleString()}`}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Brevo historical campaigns ── */}
      <section className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">حملات سابقة (Brevo)</h2>
          <p className="text-xs text-slate-500 mt-0.5">حملات أُرسلت مباشرة عبر Brevo قبل إطلاق المنصة</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 leading-relaxed">
          <strong>كيف يعمل:</strong> اختر حملة → اضغط &quot;حفظ النشيطين&quot; → سيُنشأ تلقائياً قائمة جديدة في Admin → Lists تحتوي فقط من فتح الايميل.
        </div>

        {loadingBrevo && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}

        {errorBrevo && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorBrevo}</div>
        )}

        {!loadingBrevo && brevoCampaigns.length === 0 && !errorBrevo && (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
            <BarChart2 size={28} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">لا توجد حملات مرسلة في Brevo</p>
          </div>
        )}

        <div className="space-y-3">
          {brevoCampaigns.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      سابقة
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{c.subject}</p>
                  {c.sent_date && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(c.sent_date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-1">
                  <StatChip icon={Mail}         label="تم التسليم" value={c.delivered.toLocaleString()}    className="bg-slate-50 text-slate-600" />
                  <StatChip icon={Users}        label="فتح"        value={c.unique_opens.toLocaleString()} className="bg-emerald-50 text-emerald-700" />
                  <StatChip icon={MousePointer} label="ضغط"        value={c.unique_clicks.toLocaleString()} className="bg-blue-50 text-blue-700" />
                  <StatChip icon={BarChart2}    label="open rate"  value={`${c.open_rate}%`}               className="bg-violet-50 text-violet-700" />
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                    className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50">
                    {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {c.unique_opens > 0 && (
                    <button onClick={() => setSaving(c)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                      <Save size={12} /> حفظ النشيطين
                    </button>
                  )}
                </div>
              </div>

              {expanded === c.id && (
                <div className="border-t border-slate-100 bg-slate-50 p-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[
                    { label: "تم التسليم",   value: c.delivered.toLocaleString(),      color: "text-slate-700" },
                    { label: "فتحوا",         value: c.unique_opens.toLocaleString(),   color: "text-emerald-700" },
                    { label: "ضغطوا",         value: c.unique_clicks.toLocaleString(),  color: "text-blue-700" },
                    { label: "إلغاء اشتراك",  value: c.unsubscriptions.toLocaleString(), color: "text-rose-600" },
                    { label: "معدل الفتح",    value: `${c.open_rate}%`,                 color: "text-violet-700" },
                    { label: "معدل الضغط",    value: c.delivered ? `${(c.unique_clicks / c.delivered * 100).toFixed(1)}%` : "0%", color: "text-blue-700" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl bg-white border border-slate-100 p-3 text-center">
                      <p className={`text-base font-bold tabular-nums ${color}`}>{value}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {saving && (
        <SaveModal
          campaign={saving}
          onClose={() => setSaving(null)}
          onSaved={(result) => {
            setSaving(null);
            setToast(`✓ تم حفظ ${result.added.toLocaleString()} ايميل في قائمة "${result.list_name}"`);
          }}
        />
      )}
      {toast && <SuccessToast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}

/* ─── campaign creation wizard ───────────────────────────────────────── */

const WARMUP_SCHEDULE = [
  { period: "Days 1–3",   limit: "500 / day" },
  { period: "Days 4–7",   limit: "1,000 / day" },
  { period: "Days 8–14",  limit: "3,000 / day" },
  { period: "Days 15–21", limit: "8,000 / day" },
  { period: "Days 22–28", limit: "20,000 / day" },
  { period: "Day 29+",    limit: "50,000 / day" },
];

type WizardStep = "details" | "import" | "preview" | "activate";

function CreateCampaignWizard({ onDone, existingCampaignId }: { onDone: () => void; existingCampaignId?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<WizardStep>(existingCampaignId ? "import" : "details");

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [fromName, setFromName] = useState("JobAI24");
  const [fromEmail, setFromEmail] = useState("marketing@jobai24.com");

  const [campaignId, setCampaignId] = useState(existingCampaignId ?? "");
  const [campaignData, setCampaignData] = useState<MarketingCampaign | null>(null);
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existingCampaignId) {
      getCampaign(existingCampaignId)
        .then(setCampaignData)
        .catch(() => {});
    }
  }, [existingCampaignId]);

  const STEPS: WizardStep[] = ["details", "import", "preview", "activate"];
  const stepIdx = STEPS.indexOf(step);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !htmlBody.trim()) return;
    setLoading(true); setError("");
    try {
      const c = await createCampaign({ name: name.trim(), subject: subject.trim(), html_body: htmlBody.trim(), from_name: fromName.trim(), from_email: fromEmail.trim() });
      setCampaignId(c.id);
      setCampaignData(c);
      setStep("import");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function handleImport(file: File) {
    setLoading(true); setError("");
    try { setImportResult(await importContacts(campaignId, file)); }
    catch (e) { setError(e instanceof Error ? e.message : "Import failed"); }
    finally { setLoading(false); }
  }

  async function handleActivate() {
    setLoading(true); setError("");
    try { await activateCampaign(campaignId); onDone(); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to activate"); }
    finally { setLoading(false); }
  }

  const stepLabels: Record<WizardStep, string> = {
    details:  "التفاصيل",
    import:   "استيراد جهات الاتصال",
    preview:  "المعاينة والتأكيد",
    activate: "التفعيل",
  };

  const previewHtml = campaignData?.html_body ?? htmlBody;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">إنشاء حملة تسويقية جديدة</h2>
        <p className="text-xs text-slate-500 mt-0.5">بريد جماعي مع تسخين تلقائي للدومين</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2 items-center flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold
              ${step === s ? "bg-slate-900 text-white" : i < stepIdx ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
              {i < stepIdx ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${step === s ? "text-slate-900" : "text-slate-400"}`}>
              {stepLabels[s]}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Step 1 — details */}
      {step === "details" && (
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">اسم الحملة</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثال: حملة يونيو للباحثين عن عمل"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">اسم المُرسِل</label>
              <input value={fromName} onChange={(e) => setFromName(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">بريد المُرسِل</label>
              <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">سطر الموضوع</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="مثال: وظائف جديدة تنتظرك على منصة JobAI24"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">محتوى البريد (HTML)</label>
            <textarea value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} required rows={10}
              placeholder="<html>...</html>"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 resize-y" />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "جاري الإنشاء…" : "متابعة →"}
          </button>
        </form>
      )}

      {/* Step 2 — import */}
      {step === "import" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">استيراد جهات الاتصال من Excel</p>
          <p className="text-xs text-slate-500">
            يجب أن يحتوي الملف على عمود <code className="rounded bg-slate-100 px-1">email</code>. اختياري: <code className="rounded bg-slate-100 px-1">full_name</code>
          </p>
          <button onClick={() => downloadTemplate()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
            <Download size={13} /> تحميل النموذج
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImport(f); }} />
          {!importResult ? (
            <button onClick={() => fileRef.current?.click()} disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm font-semibold text-slate-500 hover:border-slate-400 disabled:opacity-50">
              <Upload size={18} />
              {loading ? "جاري الاستيراد…" : "انقر لرفع ملف Excel"}
            </button>
          ) : (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm">
              <p className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle size={16} /> اكتمل الاستيراد</p>
              <p className="mt-1 text-emerald-700">تمت الإضافة: <strong>{importResult.added.toLocaleString()}</strong> جهة اتصال</p>
              {importResult.skipped > 0 && <p className="text-emerald-600">تم تخطي (غير صالح/مكرر): {importResult.skipped.toLocaleString()}</p>}
            </div>
          )}
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            {!existingCampaignId && (
              <button onClick={() => setStep("details")}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                ← رجوع
              </button>
            )}
            {importResult && (
              <button onClick={() => setStep("preview")}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white">
                متابعة للمعاينة →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — preview & confirm */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Campaign details summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <p className="text-sm font-bold text-slate-800">ملخص الحملة</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: "اسم الحملة",   value: campaignData?.name    ?? name },
                { label: "سطر الموضوع",  value: campaignData?.subject ?? subject },
                { label: "اسم المُرسِل", value: campaignData?.from_name ?? fromName },
                { label: "بريد المُرسِل", value: campaignData?.from_email ?? fromEmail },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                  <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                  <p className="font-semibold text-slate-800 truncate">{value}</p>
                </div>
              ))}
            </div>
            {importResult && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                <Users size={14} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-800">
                  {importResult.added.toLocaleString()} جهة اتصال جاهزة للإرسال
                  {importResult.skipped > 0 && <span className="font-normal text-emerald-600"> · تم تخطي {importResult.skipped.toLocaleString()}</span>}
                </p>
              </div>
            )}
          </div>

          {/* HTML email preview */}
          {previewHtml ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-semibold text-slate-700">معاينة البريد الإلكتروني</p>
                <span className="text-[10px] text-slate-400">HTML Preview</span>
              </div>
              <iframe
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
                className="w-full h-96 border-0"
                title="email-preview"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
              <p className="text-xs text-slate-400">لا توجد معاينة للمحتوى</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep("import")}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              ← رجوع
            </button>
            <button onClick={() => setStep("activate")}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">
              تأكيد والمتابعة →
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — activate */}
      {step === "activate" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">مراجعة جدول التسخين والتفعيل</p>
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">الفترة</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">الحد اليومي</th>
                </tr>
              </thead>
              <tbody>
                {WARMUP_SCHEDULE.map(({ period, limit }, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-3 py-2 text-slate-700">{period}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            تأكد من إعداد <strong>BREVO_API_KEY</strong> في متغيرات بيئة Railway قبل التفعيل.
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={() => setStep("preview")}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              ← رجوع
            </button>
            <button onClick={() => void handleActivate()} disabled={loading}
              className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {loading ? "جاري التفعيل…" : "تفعيل الحملة"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── overview view ──────────────────────────────────────────────────── */

type DateRange = "7d" | "30d" | "90d" | "all";

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: "آخر 7 أيام",  value: "7d" },
  { label: "آخر 30 يوم",  value: "30d" },
  { label: "آخر 90 يوم",  value: "90d" },
  { label: "كل الوقت",    value: "all" },
];

function cutoffDate(range: DateRange): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-start gap-4">
      <div className={`rounded-xl p-2.5 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function OverviewView({ onNewCampaign, onGoAnalytics }: {
  onNewCampaign: () => void;
  onGoAnalytics: () => void;
}) {
  const [range, setRange] = useState<DateRange>("30d");
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [brevoCampaigns, setBrevoCampaigns] = useState<BrevoEmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getCampaigns(), getBrevoEmailCampaigns()])
      .then(([c, b]) => { setCampaigns(c); setBrevoCampaigns(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cutoff = cutoffDate(range);

  const filteredBrevo = brevoCampaigns.filter((c) => {
    if (!cutoff || !c.sent_date) return true;
    return new Date(c.sent_date) >= cutoff;
  });

  const filteredPlatform = campaigns.filter((c) => {
    if (!cutoff || !c.warmup_start_date) return true;
    return new Date(c.warmup_start_date) >= cutoff;
  });

  const totalDelivered     = filteredBrevo.reduce((s, c) => s + c.delivered, 0);
  const totalOpens         = filteredBrevo.reduce((s, c) => s + c.unique_opens, 0);
  const totalClicks        = filteredBrevo.reduce((s, c) => s + c.unique_clicks, 0);
  const avgOpenRate        = filteredBrevo.filter((c) => c.delivered > 0).length
    ? Math.round(filteredBrevo.filter((c) => c.delivered > 0).reduce((s, c) => s + c.open_rate, 0) / filteredBrevo.filter((c) => c.delivered > 0).length * 10) / 10
    : 0;

  const activeCampaigns    = campaigns.filter((c) => c.status === "active" || c.status === "paused");
  const topBrevo           = [...filteredBrevo].sort((a, b) => b.unique_opens - a.unique_opens).slice(0, 5);

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">نظرة عامة</h2>
          <p className="text-xs text-slate-500 mt-0.5">ملخص أداء الحملات التسويقية</p>
        </div>
        {/* Date filter */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors
                ${range === r.value ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1,2,3,4].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <KpiCard icon={Send}        label="إجمالي المُرسَل"  value={totalDelivered.toLocaleString()} sub={`${filteredBrevo.length} حملة`}  color="bg-blue-50 text-blue-600" />
            <KpiCard icon={Eye}         label="إجمالي الفتح"    value={totalOpens.toLocaleString()}     sub="unique opens"                     color="bg-emerald-50 text-emerald-600" />
            <KpiCard icon={MousePointer}label="إجمالي الضغط"   value={totalClicks.toLocaleString()}    sub="unique clicks"                    color="bg-violet-50 text-violet-600" />
            <KpiCard icon={TrendingUp}  label="متوسط معدل الفتح" value={`${avgOpenRate}%`}             sub="open rate"                        color="bg-amber-50 text-amber-600" />
          </div>

          {/* Active platform campaigns */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">الحملات النشطة على المنصة</h3>
              <button onClick={onGoAnalytics} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                عرض الكل ←
              </button>
            </div>

            {activeCampaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
                <Zap size={24} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs text-slate-500">لا توجد حملات نشطة حالياً</p>
                <button onClick={onNewCampaign} className="mt-3 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                  <Plus size={13} /> إنشاء حملة
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeCampaigns.map((c) => (
                  <div key={c.id} className={`rounded-2xl border bg-white p-4 shadow-sm ${c.total_failed > 0 && c.total_sent === 0 ? "border-rose-200" : "border-slate-200"}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                          <StatusBadge status={c.status} />
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{c.subject}</p>
                      </div>
                      <div className="flex items-center gap-4 text-center shrink-0">
                        <div>
                          <p className="text-sm font-bold text-slate-900 tabular-nums">{c.total_contacts.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">جهة اتصال</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-700 tabular-nums">{c.total_sent.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">مُرسَل</p>
                        </div>
                        {c.total_failed > 0 && (
                          <div>
                            <p className="text-sm font-bold text-rose-600 tabular-nums">{c.total_failed.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400">فشل</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-slate-900 tabular-nums">{c.current_daily_limit.toLocaleString()}</p>
                          <p className="text-[10px] text-slate-400">الحد اليومي</p>
                        </div>
                      </div>
                    </div>
                    {c.total_failed > 0 && c.total_sent === 0 && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5 text-xs text-rose-700">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span>الإرسال يفشل — تحقق من <strong>BREVO_API_KEY</strong> في Railway وتأكد أن بريد المُرسِل مفعّل في Brevo</span>
                      </div>
                    )}
                    {c.total_contacts > 0 && (
                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-[10px] text-slate-400">
                          <span>التقدم</span><span>{c.progress_pct}%</span>
                        </div>
                        <ProgressBar pct={c.progress_pct} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Top Brevo campaigns */}
          {topBrevo.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">أفضل حملات Brevo بالفتح</h3>
                <button onClick={onGoAnalytics} className="text-xs text-slate-500 hover:text-slate-700 font-medium">
                  عرض الكل ←
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5 text-right font-semibold text-slate-500">الحملة</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-500">مُرسَل</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-500">فتح</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-500">ضغط</th>
                      <th className="px-4 py-2.5 text-center font-semibold text-slate-500">معدل الفتح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topBrevo.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                        <td className="px-4 py-2.5 font-medium text-slate-800 max-w-[180px] truncate">{c.name}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums text-slate-600">{c.delivered.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums text-emerald-700 font-semibold">{c.unique_opens.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center tabular-nums text-blue-700">{c.unique_clicks.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`font-bold tabular-nums ${c.open_rate >= 20 ? "text-emerald-700" : c.open_rate >= 10 ? "text-amber-600" : "text-slate-500"}`}>
                            {c.open_rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Platform summary */}
          {filteredPlatform.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800">ملخص حملات المنصة</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "إجمالي الحملات",   value: filteredPlatform.length, color: "text-slate-900" },
                  { label: "إجمالي جهات الاتصال", value: filteredPlatform.reduce((s,c) => s + c.total_contacts, 0).toLocaleString(), color: "text-slate-900" },
                  { label: "إجمالي المُرسَل",   value: filteredPlatform.reduce((s,c) => s + c.total_sent, 0).toLocaleString(), color: "text-emerald-700" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                    <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
                    <p className="text-xs text-slate-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ─── page root ──────────────────────────────────────────────────────── */

type View = "overview" | "analytics" | "create";

const NAV: { view: View; label: string; icon: React.ElementType }[] = [
  { view: "overview",  label: "نظرة عامة",  icon: LayoutDashboard },
  { view: "analytics", label: "التحليل",    icon: BarChart2 },
  { view: "create",    label: "إنشاء حملة", icon: Plus },
];

export default function MarketingPage() {
  const [view, setView] = useState<View>("overview");
  const [analyticsKey, setAnalyticsKey] = useState(0);
  const [setupCampaignId, setSetupCampaignId] = useState<string | undefined>();

  function goAnalytics() {
    setView("analytics");
    setAnalyticsKey((k) => k + 1);
  }

  function handleSetupCampaign(id: string) {
    setSetupCampaignId(id);
    setView("create");
  }

  function handleNewCampaign() {
    setSetupCampaignId(undefined);
    setView("create");
  }

  return (
    <div className="flex h-full min-h-screen">
      {/* Internal sidebar */}
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="px-4 py-5 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Megaphone size={16} className="text-slate-600" />
            <span className="text-xs font-bold text-slate-700 leading-tight">التسويق للباحث عن عمل</span>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ view: v, label, icon: Icon }) => (
            <button
              key={v}
              onClick={() => { if (v === "create") handleNewCampaign(); else setView(v); }}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors text-left
                ${view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        {view === "overview"  && <OverviewView onNewCampaign={handleNewCampaign} onGoAnalytics={goAnalytics} />}
        {view === "analytics" && <AnalyticsView key={analyticsKey} onNewCampaign={handleNewCampaign} onSetupCampaign={handleSetupCampaign} />}
        {view === "create"    && <CreateCampaignWizard onDone={goAnalytics} existingCampaignId={setupCampaignId} />}
      </main>
    </div>
  );
}
