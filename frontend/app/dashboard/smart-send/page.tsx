"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  disconnectGmail,
  getGmailAuthUrl,
  getGmailRequestStatus,
  getGmailStatus,
  requestGmailAccess,
  testGmailSend,
} from "@/lib/smart-send";
import type { GmailConnectionRequest, GmailStatus } from "@/types";

// ─── Gmail Connect Panel (kept on landing as prerequisite) ────────────────────

function GmailConnectPanel({
  status,
  onConnected,
  onDisconnected,
}: {
  status: GmailStatus;
  onConnected: () => void;
  onDisconnected: () => void;
}) {
  const t = useTranslations("smartSendPage");
  const [request, setRequest] = useState<GmailConnectionRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testFailed, setTestFailed] = useState(false);
  const [error, setError] = useState("");
  const [requestedGmail, setRequestedGmail] = useState("");

  useEffect(() => {
    if (!status.is_connected) {
      getGmailRequestStatus().then(setRequest).finally(() => setLoadingRequest(false));
    } else {
      setLoadingRequest(false);
    }
  }, [status.is_connected]);

  async function handleRequestAccess() {
    const gmail = requestedGmail.trim().toLowerCase();
    if (gmail && !gmail.endsWith("@gmail.com")) { setError(t("gmail.invalidGmail")); return; }
    setSubmitting(true); setError("");
    try { const req = await requestGmailAccess(gmail || undefined); setRequest(req); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t("gmail.requestFailed")); }
    finally { setSubmitting(false); }
  }

  async function handleConnect() {
    setError("");
    try { const authUrl = await getGmailAuthUrl(); window.location.href = authUrl; }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t("gmail.connectFailed")); }
  }

  async function handleDisconnect() {
    setDisconnecting(true); setError("");
    try { await disconnectGmail(); onDisconnected(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t("gmail.disconnectFailed")); }
    finally { setDisconnecting(false); }
  }

  if (status.is_connected) {
    return (
      <div className="bg-teal-light/20 border border-teal-light rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">✓</div>
          <div>
            <p className="text-sm font-medium text-teal">{t("gmail.connected")}</p>
            <p className="text-xs text-slate-500">{status.gmail_address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={async () => {
              setTestingSend(true); setTestResult(null);
              try { const res = await testGmailSend(); setTestFailed(false); setTestResult(res.detail ?? t("gmail.testSuccess")); }
              catch (e: unknown) { setTestFailed(true); setTestResult(e instanceof Error ? e.message : t("gmail.testUnknownError")); }
              finally { setTestingSend(false); }
            }}
            disabled={testingSend}
            className="text-xs border border-brand-200 text-brand-700 rounded-lg px-3 py-1.5 hover:bg-brand-50 disabled:opacity-50"
          >
            {testingSend ? t("gmail.testSending") : t("gmail.testBtn")}
          </button>
          <button onClick={() => void handleDisconnect()} disabled={disconnecting} className="text-xs border border-slate-200 text-slate-500 rounded-lg px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50">
            {disconnecting ? t("gmail.disconnecting") : t("gmail.disconnect")}
          </button>
        </div>
        {testResult && (
          <p className={`text-xs px-3 py-2 rounded-lg ${testFailed ? "bg-rose-50 text-rose-700" : "bg-teal-50 text-teal-700"}`}>{testResult}</p>
        )}
        {error && <p className="text-rose-600 text-xs">{error}</p>}
      </div>
    );
  }

  if (loadingRequest) return <div className="h-16 animate-pulse rounded-xl bg-slate-100" />;

  return (
    <div className="border border-brand-200 rounded-xl p-5 space-y-4 bg-brand-50">
      <div>
        <h3 className="text-sm font-semibold text-brand-800">{t("gmail.title")}</h3>
        <p className="text-xs text-brand-700 mt-1">{t("gmail.description")}</p>
      </div>

      {!request && (
        <div className="space-y-3">
          <div className="rounded-xl border border-brand-200 bg-white p-3 text-sm text-brand-800 space-y-1">
            <p className="font-semibold text-xs">{t("gmail.requestTitle")}</p>
            <p className="text-xs text-brand-700">{t("gmail.requestDesc")}</p>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-brand-700">{t("gmail.gmailLabel")} <span className="text-slate-400 font-normal">{t("gmail.gmailOptional")}</span></label>
            <input type="email" value={requestedGmail} onChange={(e) => setRequestedGmail(e.target.value)} placeholder="example@gmail.com" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" dir="ltr" />
          </div>
          {error && <p className="text-rose-600 text-xs">{error}</p>}
          <button onClick={() => void handleRequestAccess()} disabled={submitting} className="w-full bg-brand-800 text-white rounded-lg py-2 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50">
            {submitting ? t("gmail.requesting") : t("gmail.requestBtn")}
          </button>
        </div>
      )}

      {request?.status === "pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /><p className="text-sm font-semibold text-amber-800">{t("gmail.pendingTitle")}</p></div>
          <p className="text-xs text-amber-700">{t("gmail.pendingDesc")}</p>
        </div>
      )}

      {request?.status === "approved" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-teal-light bg-teal-light/20 p-3 flex items-center gap-3">
            <div className="w-6 h-6 bg-teal rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">✓</div>
            <div><p className="text-sm font-semibold text-teal">{t("gmail.approvedTitle")}</p><p className="text-xs text-slate-500">{t("gmail.approvedDesc")}</p></div>
          </div>
          {error && <p className="text-rose-600 text-xs">{error}</p>}
          <button onClick={() => void handleConnect()} className="w-full bg-brand-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-brand-700 flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.908 8.908 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" /></svg>
            {t("gmail.connectBtn")}
          </button>
        </div>
      )}

      {request?.status === "rejected" && (
        <div className="space-y-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-1">
            <p className="text-sm font-semibold text-rose-700">{t("gmail.rejectedTitle")}</p>
            {request.rejection_reason && <p className="text-xs text-rose-600">{request.rejection_reason}</p>}
          </div>
          <button onClick={() => setRequest(null)} className="w-full border border-slate-300 text-slate-700 rounded-lg py-2 text-sm font-semibold hover:bg-slate-50">{t("gmail.reRequestBtn")}</button>
        </div>
      )}
    </div>
  );
}

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
            href="/dashboard/smart-send/resume"
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
