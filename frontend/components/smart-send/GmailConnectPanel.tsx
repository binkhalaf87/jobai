"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  disconnectGmail,
  getGmailAuthUrl,
  testGmailSend,
} from "@/lib/smart-send";
import type { GmailStatus } from "@/types";

export function GmailConnectPanel({
  status,
  onConnected,
  onDisconnected,
}: {
  status: GmailStatus;
  onConnected: () => void;
  onDisconnected: () => void;
}) {
  const t = useTranslations("smartSendPage");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testingSend, setTestingSend] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testFailed, setTestFailed] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setConnecting(true); setError("");
    try { const authUrl = await getGmailAuthUrl(); window.location.href = authUrl; }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t("gmail.connectFailed")); setConnecting(false); }
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

  return (
    <div className="border border-brand-200 rounded-xl p-5 space-y-4 bg-brand-50">
      <div>
        <h3 className="text-sm font-semibold text-brand-800">{t("gmail.title")}</h3>
        <p className="text-xs text-brand-700 mt-1">{t("gmail.description")}</p>
      </div>
      {error && <p className="text-rose-600 text-xs">{error}</p>}
      <button
        onClick={() => void handleConnect()}
        disabled={connecting}
        className="w-full bg-brand-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.908 8.908 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" /></svg>
        {connecting ? t("gmail.connecting") : t("gmail.connectBtn")}
      </button>
    </div>
  );
}
