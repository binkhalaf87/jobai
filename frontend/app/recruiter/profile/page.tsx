"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserCircle, Mail, CheckCircle2, AlertCircle } from "lucide-react";

import {
  disconnectGmail,
  getGmailStatus,
} from "@/lib/smart-send";
import type { GmailStatus } from "@/types";

type Tab = "profile" | "send-settings";

function SendSettingsTab() {
  const t = useTranslations("recruiter.profilePage");
  const [status, setStatus] = useState<GmailStatus>({ is_connected: false, gmail_address: null });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getGmailStatus()
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    setError(null);
    try {
      const { getGmailAuthUrl } = await import("@/lib/smart-send");
      const authUrl = await getGmailAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("smtp.connectFailed"));
    }
  }

  async function handleDisconnect() {
    setError(null);
    setDisconnecting(true);
    try {
      await disconnectGmail();
      setStatus({ is_connected: false, gmail_address: null });
      setSuccess(t("smtp.removed"));
    } catch {
      setError(t("smtp.failedToRemove"));
    } finally {
      setDisconnecting(false);
    }
  }

  if (loading) return <p className="text-xs text-slate-400">Loading…</p>;

  return (
    <div className="space-y-5">
      <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        status.is_connected
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}>
        {status.is_connected ? (
          <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
        ) : (
          <Mail size={15} className="flex-shrink-0 text-slate-400" />
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold ${status.is_connected ? "text-emerald-700" : "text-slate-600"}`}>
            {status.is_connected
              ? t("smtp.statusVerified", { email: status.gmail_address ?? "" })
              : t("smtp.statusNotConfigured")}
          </p>
          {!status.is_connected && (
            <p className="text-xs text-slate-400 mt-0.5">{t("smtp.noConnectionDesc")}</p>
          )}
        </div>
      </div>

      {!status.is_connected && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-xs text-violet-800 space-y-1.5">
          <p className="font-bold">{t("smtp.howToTitle")}</p>
          <ol className="list-decimal list-inside space-y-1 text-violet-700">
            <li>{t("smtp.step1")}</li>
            <li>{t("smtp.step2")}</li>
            <li>{t("smtp.step3")}</li>
          </ol>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          <AlertCircle size={13} className="flex-shrink-0" />{error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          <CheckCircle2 size={13} className="flex-shrink-0" />{success}
        </div>
      )}

      {status.is_connected ? (
        <button
          type="button"
          onClick={() => void handleDisconnect()}
          disabled={disconnecting}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-600 disabled:opacity-50"
        >
          {disconnecting ? "…" : t("smtp.remove")}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void handleConnect()}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.908 8.908 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
          </svg>
          {t("smtp.connectGmail")}
        </button>
      )}
    </div>
  );
}

export default function RecruiterProfilePage() {
  const t = useTranslations("recruiter.profilePage");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get("tab") as Tab) ?? "profile"
  );

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    router.replace(`/recruiter/profile?tab=${tab}`, { scroll: false });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "profile",       label: t("tabs.profile") },
    { key: "send-settings", label: t("tabs.sendSettings") },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <UserCircle size={16} className="text-slate-400" />
        <p className="text-[15px] font-bold tracking-tight text-slate-900">{t("title")}</p>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => switchTab(tab.key)}
              className={`px-4 py-3 text-xs font-semibold transition border-b-2 ${
                activeTab === tab.key
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900">{t("profileTab.title")}</p>
            <p className="text-sm leading-6 text-slate-500">{t("profileTab.desc")}</p>
          </div>
        )}
        {activeTab === "send-settings" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">{t("sendSettingsTab.title")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("sendSettingsTab.desc")}</p>
            </div>
            <SendSettingsTab />
          </div>
        )}
      </div>
    </div>
  );
}
