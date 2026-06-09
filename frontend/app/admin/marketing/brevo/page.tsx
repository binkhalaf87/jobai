"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Users, MousePointer, Mail, CheckCircle, Save, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import {
  getBrevoEmailCampaigns,
  saveOpenersToList,
  type BrevoEmailCampaign,
} from "@/lib/marketing";

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
          <input
            type="checkbox"
            checked={includeClickers}
            onChange={(e) => setIncludeClickers(e.target.checked)}
            className="rounded"
          />
          أضف أيضاً من ضغط على رابط (Clickers)
        </label>

        {error && <p className="text-xs text-rose-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600">
            إلغاء
          </button>
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
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-xl">
      <CheckCircle size={16} />
      {message}
    </div>
  );
}

export default function BrevoCampaignsPage() {
  const [campaigns, setCampaigns] = useState<BrevoEmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<BrevoEmailCampaign | null>(null);
  const [toast, setToast] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true); setError("");
    getBrevoEmailCampaigns()
      .then(setCampaigns)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/marketing" className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">حملات Brevo السابقة</h1>
          <p className="text-xs text-slate-500">استخرج الايميلات النشيطة واحفظها كقائمة</p>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800 leading-relaxed">
        <strong>كيف يعمل:</strong> اختر حملة → اضغط "حفظ النشيطين" → سيُنشأ تلقائياً قائمة جديدة في Admin → Lists تحتوي فقط من فتح الايميل. هذه القائمة هي الأعلى جودة لحملاتك القادمة.
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && campaigns.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Mail size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">لا توجد حملات مرسلة في Brevo</p>
          <p className="mt-1 text-xs text-slate-400">أرسل حملتك الأولى أولاً</p>
        </div>
      )}

      <div className="space-y-3">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Main row */}
            <div className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                <p className="text-xs text-slate-500 truncate">{c.subject}</p>
                {c.sent_date && (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(c.sent_date).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-1">
                <StatChip icon={Mail}         label="تم التسليم" value={c.delivered.toLocaleString()}      className="bg-slate-50 text-slate-600" />
                <StatChip icon={Users}        label="فتح"        value={c.unique_opens.toLocaleString()}    className="bg-emerald-50 text-emerald-700" />
                <StatChip icon={MousePointer} label="ضغط"        value={c.unique_clicks.toLocaleString()}   className="bg-blue-50 text-blue-700" />
                <StatChip icon={Mail}         label="open rate"  value={`${c.open_rate}%`}                  className="bg-violet-50 text-violet-700" />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
                >
                  {expanded === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {c.unique_opens > 0 && (
                  <button
                    onClick={() => setSaving(c)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Save size={12} /> حفظ النشيطين
                  </button>
                )}
              </div>
            </div>

            {/* Expanded stats (mobile-friendly) */}
            {expanded === c.id && (
              <div className="border-t border-slate-100 bg-slate-50 p-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "تم التسليم",  value: c.delivered.toLocaleString(),      color: "text-slate-700" },
                  { label: "فتحوا",        value: c.unique_opens.toLocaleString(),    color: "text-emerald-700" },
                  { label: "ضغطوا",        value: c.unique_clicks.toLocaleString(),   color: "text-blue-700" },
                  { label: "إلغاء اشتراك", value: c.unsubscriptions.toLocaleString(), color: "text-rose-600" },
                  { label: "معدل الفتح",   value: `${c.open_rate}%`,                  color: "text-violet-700" },
                  { label: "معدل الضغط",   value: c.delivered ? `${(c.unique_clicks / c.delivered * 100).toFixed(1)}%` : "0%", color: "text-blue-700" },
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
