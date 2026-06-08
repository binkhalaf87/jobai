"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getGmailStatus } from "@/lib/smart-send";
import { GmailConnectPanel } from "@/components/smart-send/GmailConnectPanel";
import type { GmailStatus } from "@/types";

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({ href, icon, title, description, primary }: {
  href: string; icon: string; title: string; description: string; primary?: boolean;
}) {
  return (
    <Link href={href} className={`block rounded-xl border p-5 transition-all hover:shadow-md ${primary ? "bg-brand-800 border-brand-700 text-white hover:bg-brand-700" : "bg-white border-slate-200 hover:border-brand-300"}`}>
      <div className="text-2xl mb-3">{icon}</div>
      <p className={`font-semibold text-sm mb-1 ${primary ? "text-white" : "text-slate-800"}`}>{title}</p>
      <p className={`text-xs ${primary ? "text-brand-200" : "text-slate-500"}`}>{description}</p>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartSendPage() {
  const t = useTranslations("smartSendPage");
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>({ is_connected: false, gmail_address: null });
  const [loading, setLoading] = useState(true);
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const gmailError = params.get("gmail_error");
      if (gmailError) {
        const key = gmailError === "invalid_state" ? "gmail.oauthErrorInvalidState" : gmailError === "token_exchange_failed" ? "gmail.oauthErrorTokenExchange" : "gmail.oauthErrorUnknown";
        setOauthError(t(key as Parameters<typeof t>[0]));
      }
      if (params.has("gmail_connected") || params.has("gmail_error")) window.history.replaceState({}, "", window.location.pathname);
    }
    getGmailStatus()
      .then((s) => setGmailStatus(s))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="h-6 w-48 bg-slate-100 rounded animate-pulse mb-8" />
        <div className="h-16 bg-slate-100 rounded-xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 mb-1">{t("eyebrow")}</p>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("description")}</p>
      </div>

      {oauthError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between gap-3">
          <span>{oauthError}</span>
          <button onClick={() => setOauthError(null)} className="text-rose-400 hover:text-rose-600 font-bold">✕</button>
        </div>
      )}

      {/* Gmail connection — always visible */}
      <GmailConnectPanel
        status={gmailStatus}
        onConnected={() => setGmailStatus((s) => ({ ...s, is_connected: true }))}
        onDisconnected={() => setGmailStatus({ is_connected: false, gmail_address: null })}
      />

      {/* Action cards — only when connected */}
      {gmailStatus.is_connected && (
        <div className="grid grid-cols-1 gap-4">
          <ActionCard
            href="/dashboard/smart-send/list"
            icon="✉️"
            title={t("wizard.newCampaign")}
            description={t("wizard.newCampaignDesc")}
            primary
          />
          <div className="grid grid-cols-2 gap-4">
            <ActionCard href="/dashboard/smart-send/campaigns" icon="📊" title={t("wizard.activeCampaigns")} description={t("wizard.activeCampaignsDesc")} />
            <ActionCard href="/dashboard/smart-send/history" icon="📋" title={t("wizard.sendHistory")} description={t("wizard.sendHistoryDesc")} />
          </div>
        </div>
      )}
    </main>
  );
}
