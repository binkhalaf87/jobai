"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getHistory } from "@/lib/smart-send";
import type { SendHistoryItem } from "@/types";

export default function HistoryPage() {
  const t = useTranslations("smartSendPage");
  const [history, setHistory] = useState<SendHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sentCount = history.filter((h) => h.status === "sent").length;
  const failedCount = history.filter((h) => h.status === "failed").length;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 mb-1">{t("historyPage.eyebrow")}</p>
          <h1 className="text-xl font-bold text-slate-800">{t("historyPage.title")}</h1>
        </div>
        <Link href="/dashboard/smart-send" className="text-xs border border-slate-200 text-slate-500 rounded-lg px-3 py-1.5 hover:bg-slate-50">
          {t("historyPage.backBtn")}
        </Link>
      </div>

      {/* Stats */}
      {!loading && history.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-slate-800">{history.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t("historyPage.totalLabel")}</p>
          </div>
          <div className="bg-white border border-teal-light rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-teal">{sentCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t("historyPage.sentLabel")}</p>
          </div>
          <div className="bg-white border border-rose-100 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-rose-600">{failedCount}</p>
            <p className="text-xs text-slate-500 mt-0.5">{t("historyPage.failedLabel")}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-4xl">📭</p>
          <p className="text-sm text-slate-500">{t("historyPage.noHistory")}</p>
          <Link href="/dashboard/smart-send/letter" className="inline-block bg-brand-800 text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-brand-700">
            {t("historyPage.startCampaignBtn")}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <div key={item.id} className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${item.status === "failed" ? "border-rose-100" : "border-slate-200"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${item.status === "sent" ? "bg-teal/10 text-teal" : "bg-rose-100 text-rose-600"}`}>
                {item.status === "sent" ? "✓" : "✕"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.subject}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {item.recipient_name ? `${item.recipient_name} — ` : ""}{item.recipient_email}
                </p>
                {item.job_title && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {item.job_title}{item.company_name ? ` — ${item.company_name}` : ""}
                  </p>
                )}
                {item.error_message && (
                  <p className="text-xs text-rose-600 mt-1">{item.error_message}</p>
                )}
              </div>
              <div className="text-xs text-slate-400 flex-shrink-0 text-left">
                {item.sent_at
                  ? new Date(item.sent_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })
                  : new Date(item.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
