"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StepBar } from "@/components/smart-send/StepBar";
import { GmailConnectPanel } from "@/components/smart-send/GmailConnectPanel";
import { getGmailStatus } from "@/lib/smart-send";
import type { GmailStatus } from "@/types";

export default function ConnectPage() {
  const router = useRouter();
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
      .then(setGmailStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={3} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">{t("connectStep.title")}</h1>
        <p className="text-sm text-slate-500 mt-1">{t("connectStep.description")}</p>
      </div>

      {oauthError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center justify-between gap-3">
          <span>{oauthError}</span>
          <button onClick={() => setOauthError(null)} className="text-rose-400 hover:text-rose-600 font-bold">✕</button>
        </div>
      )}

      {loading ? (
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      ) : (
        <GmailConnectPanel
          status={gmailStatus}
          onConnected={() => setGmailStatus((s) => ({ ...s, is_connected: true }))}
          onDisconnected={() => setGmailStatus({ is_connected: false, gmail_address: null })}
        />
      )}

      {gmailStatus.is_connected && (
        <div className="rounded-xl border border-teal-light bg-teal-light/10 px-4 py-3 text-sm text-teal">
          {t("connectStep.connectedHint")}
        </div>
      )}

      {!gmailStatus.is_connected && !loading && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t("connectStep.requiredHint")}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/smart-send/settings" className="text-sm text-slate-500 hover:text-slate-700">{t("wizard.back")}</Link>
        <button
          onClick={() => router.push("/dashboard/smart-send/letter")}
          disabled={!gmailStatus.is_connected}
          className="bg-brand-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("wizard.next")}
        </button>
      </div>
    </main>
  );
}
