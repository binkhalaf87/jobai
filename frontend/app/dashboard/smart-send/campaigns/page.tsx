"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCampaigns, pauseCampaign, resumeCampaign, retryFailedContacts } from "@/lib/smart-send";
import type { Campaign } from "@/types";

const STATUS_LABELS: Record<Campaign["status"], string> = {
  active: "نشطة",
  paused: "موقوفة",
  completed: "مكتملة",
  failed: "فشلت",
  error: "خطأ",
};

const STATUS_STYLES: Record<Campaign["status"], string> = {
  active: "bg-teal/10 text-teal",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  failed: "bg-rose-100 text-rose-700",
  error: "bg-rose-100 text-rose-700",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function load() {
    try {
      const list = await getCampaigns();
      setCampaigns(list);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function handlePause(id: string) {
    setActionLoading(id);
    try { const updated = await pauseCampaign(id); setCampaigns((prev) => prev.map((c) => c.id === id ? updated : c)); }
    catch { /* ignore */ }
    finally { setActionLoading(null); }
  }

  async function handleResume(id: string) {
    setActionLoading(id);
    try { const updated = await resumeCampaign(id); setCampaigns((prev) => prev.map((c) => c.id === id ? updated : c)); }
    catch { /* ignore */ }
    finally { setActionLoading(null); }
  }

  async function handleRetry(id: string) {
    setActionLoading(id);
    try { const updated = await retryFailedContacts(id); setCampaigns((prev) => prev.map((c) => c.id === id ? updated : c)); }
    catch { /* ignore */ }
    finally { setActionLoading(null); }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 mb-1">Smart Send</p>
          <h1 className="text-xl font-bold text-slate-800">الحملات النشطة</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setLoading(true); void load(); }} className="text-xs border border-slate-200 text-slate-500 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            تحديث
          </button>
          <Link href="/dashboard/smart-send" className="text-xs border border-slate-200 text-slate-500 rounded-lg px-3 py-1.5 hover:bg-slate-50">
            العودة
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">📭</p>
          <p className="text-sm text-slate-500">لا توجد حملات حتى الآن</p>
          <Link href="/dashboard/smart-send/letter" className="inline-block bg-brand-800 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-brand-700">
            بدء حملة جديدة
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const isBusy = actionLoading === campaign.id;
            return (
              <div key={campaign.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{campaign.subject}</p>
                    {campaign.list_name && <p className="text-xs text-slate-500 mt-0.5">{campaign.list_name}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLES[campaign.status]}`}>
                    {STATUS_LABELS[campaign.status]}
                  </span>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>{campaign.total_sent} مُرسل</span>
                    <span>{campaign.total_contacts} إجمالي</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all"
                      style={{ width: `${campaign.total_contacts > 0 ? Math.round((campaign.total_sent / campaign.total_contacts) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                    <span>{campaign.total_contacts > 0 ? Math.round((campaign.total_sent / campaign.total_contacts) * 100) : 0}%</span>
                    {campaign.total_failed > 0 && <span className="text-rose-500">{campaign.total_failed} فشل</span>}
                  </div>
                </div>

                {/* Error */}
                {campaign.error_message && (
                  <div className="rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                    {campaign.error_message}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{campaign.daily_limit} رسالة/يوم</span>
                  {campaign.last_sent_at && (
                    <span>آخر إرسال: {new Date(campaign.last_sent_at).toLocaleDateString("ar-SA")}</span>
                  )}
                  {campaign.estimated_days_remaining > 0 && campaign.status === "active" && (
                    <span>متبقٍ: {campaign.estimated_days_remaining} {campaign.estimated_days_remaining === 1 ? "يوم" : "أيام"}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {campaign.status === "active" && (
                    <button onClick={() => void handlePause(campaign.id)} disabled={isBusy} className="text-xs border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5 hover:bg-amber-50 disabled:opacity-50">
                      {isBusy ? "..." : "إيقاف مؤقت"}
                    </button>
                  )}
                  {campaign.status === "paused" && (
                    <button onClick={() => void handleResume(campaign.id)} disabled={isBusy} className="text-xs border border-teal-light text-teal rounded-lg px-3 py-1.5 hover:bg-teal-light/20 disabled:opacity-50">
                      {isBusy ? "..." : "استئناف"}
                    </button>
                  )}
                  {(campaign.status === "error" || campaign.total_failed > 0) && (
                    <button onClick={() => void handleRetry(campaign.id)} disabled={isBusy} className="text-xs border border-brand-200 text-brand-700 rounded-lg px-3 py-1.5 hover:bg-brand-50 disabled:opacity-50">
                      {isBusy ? "..." : "إعادة الفاشلة"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
