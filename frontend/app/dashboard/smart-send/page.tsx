"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Panel } from "@/components/panel";
import {
  createCampaign,
  disconnectGmail,
  generateLetter,
  getCampaigns,
  getGmailStatus,
  getHistory,
  getRecipientLists,
  pauseCampaign,
  resumeCampaign,
} from "@/lib/smart-send";
import type {
  Campaign,
  GenerateLetterResponse,
  GmailStatus,
  RecipientList,
  SendHistoryItem,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "connect" | "compose" | "campaigns" | "history";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("smartSendPage");
  const colorMap: Record<string, string> = {
    sent:      "bg-teal-light/30 text-teal border border-teal-light",
    failed:    "bg-rose-50 text-rose-700 border border-rose-200",
    active:    "bg-emerald-100 text-emerald-700 border border-emerald-200",
    paused:    "bg-amber-100 text-amber-700 border border-amber-200",
    completed: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  const validKeys = ["sent", "failed", "active", "paused", "completed"];
  const key = validKeys.includes(status) ? status : "unknown";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colorMap[status] ?? "bg-slate-100 text-slate-500"}`}>
      {t(`campaigns.status.${key}`)}
    </span>
  );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Gmail Connect Panel ───────────────────────────────────────────────────────

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
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect() {
    setError("");
    try {
      const { getGmailAuthUrl } = await import("@/lib/smart-send");
      const authUrl = await getGmailAuthUrl();
      window.location.href = authUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("gmail.connectFailed"));
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    setError("");
    try {
      await disconnectGmail();
      onDisconnected();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("gmail.disconnectFailed"));
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("gmail.title")}</h2>
        <p className="text-sm text-gray-500">{t("gmail.description")}</p>
      </div>

      {status.is_connected ? (
        <div className="space-y-4">
          <div className="bg-teal-light/20 border border-teal-light rounded-xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-teal rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">✓</div>
            <div>
              <p className="text-sm font-medium text-teal">{t("gmail.connected")}</p>
              <p className="text-xs text-gray-500">{status.gmail_address}</p>
            </div>
          </div>
          <button onClick={onConnected} className="w-full bg-brand-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700">
            {t("gmail.composeBtn")}
          </button>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={() => void handleDisconnect()} disabled={disconnecting} className="w-full border border-slate-200 text-slate-600 rounded-lg py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
            {disconnecting ? t("gmail.disconnecting") : t("gmail.disconnect")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-800 space-y-1">
            <p className="font-medium">{t("gmail.howItWorks")}</p>
            <ol className="list-decimal list-inside space-y-0.5 text-brand-700">
              <li>{t("gmail.step1")}</li>
              <li>{t("gmail.step2")}</li>
              <li>{t("gmail.step3")}</li>
            </ol>
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button onClick={() => void handleConnect()} className="w-full bg-brand-800 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-brand-700 flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.908 8.908 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z" />
            </svg>
            {t("gmail.connectBtn")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Compose Panel ─────────────────────────────────────────────────────────────

function ComposePanel({
  gmailAddress,
  onLaunched,
}: {
  gmailAddress: string;
  onLaunched: () => void;
}) {
  const t = useTranslations("smartSendPage");
  const [form, setForm] = useState({ job_title: "", company_name: "", job_description: "", resume_id: "" });
  const [letter, setLetter] = useState<GenerateLetterResponse | null>(null);
  const [resumes, setResumes] = useState<import("@/types").ResumeListItem[]>([]);
  const [lists, setLists] = useState<RecipientList[]>([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [dailyLimit, setDailyLimit] = useState(100);
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [genError, setGenError] = useState("");
  const [launchError, setLaunchError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    void import("@/lib/resumes").then(({ listResumes }) => listResumes().then(setResumes).catch(() => {}));
    getRecipientLists().then(setLists).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const jt = sessionStorage.getItem("jobai_smartsend_job_title");
    const cn = sessionStorage.getItem("jobai_smartsend_company_name");
    const jd = sessionStorage.getItem("jobai_smartsend_job_description");
    if (jt || cn || jd) {
      setForm((p) => ({ ...p, job_title: jt ?? p.job_title, company_name: cn ?? p.company_name, job_description: jd ?? p.job_description }));
      sessionStorage.removeItem("jobai_smartsend_job_title");
      sessionStorage.removeItem("jobai_smartsend_company_name");
      sessionStorage.removeItem("jobai_smartsend_job_description");
    }
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenError(""); setSuccessMsg(""); setLetter(null); setGenerating(true);
    try {
      const result = await generateLetter({
        job_title: form.job_title,
        company_name: form.company_name || undefined,
        job_description: form.job_description || undefined,
        resume_id: form.resume_id || undefined,
      });
      setLetter(result);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : t("compose.generationFailed"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleLaunch() {
    if (!letter || !selectedListId) return;
    setLaunchError(""); setSuccessMsg(""); setLaunching(true);
    try {
      await createCampaign({
        list_id: selectedListId,
        subject: letter.subject,
        body: letter.body,
        resume_id: form.resume_id || undefined,
        daily_limit: dailyLimit,
      });
      setSuccessMsg(t("campaigns.settings.launched"));
      setLetter(null);
      setSelectedListId("");
      onLaunched();
    } catch {
      setLaunchError(t("campaigns.settings.launchFailed"));
    } finally {
      setLaunching(false);
    }
  }

  const selectedList = lists.find((l) => l.id === selectedListId);
  const estimatedDays = selectedList && dailyLimit > 0
    ? Math.ceil(selectedList.total_count / dailyLimit)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">{t("compose.title")}</h2>
          <p className="text-sm text-gray-500">{t("compose.description")}</p>
        </div>
        <span className="text-xs text-teal bg-teal-light/20 border border-teal-light px-2 py-1 rounded-full flex-shrink-0">{gmailAddress}</span>
      </div>

      <form onSubmit={(e) => void handleGenerate(e)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">{t("compose.jobTitle")}</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder={t("compose.jobTitlePlaceholder")} value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("compose.companyName")}</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder={t("compose.companyOptional")} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
        </div>

        {resumes.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">{t("compose.resumeLabel")} <span className="text-gray-400 font-normal">{t("compose.resumeOptional")}</span></label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.resume_id} onChange={(e) => setForm({ ...form, resume_id: e.target.value })}>
              <option value="">{t("compose.noResume")}</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.source_filename ?? r.title}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">{t("compose.jobDescription")}</label>
          <textarea rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder={t("compose.jdPlaceholder")} value={form.job_description} onChange={(e) => setForm({ ...form, job_description: e.target.value })} />
        </div>

        {genError && <p className="text-red-600 text-sm">{genError}</p>}

        <button type="submit" disabled={generating || !form.job_title.trim()} className="w-full bg-brand-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {generating ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>{t("compose.generating")}</>) : t("compose.generateBtn")}
        </button>
      </form>

      {letter && (
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">{t("compose.letterTitle")}</h3>

          <div>
            <label className="block text-sm font-medium mb-1">{t("compose.subjectLabel")}</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={letter.subject} onChange={(e) => setLetter({ ...letter, subject: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("compose.bodyLabel")}</label>
            <textarea rows={10} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono" value={letter.body} onChange={(e) => setLetter({ ...letter, body: e.target.value })} />
          </div>

          {/* Campaign settings */}
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4 space-y-3">
            <p className="text-sm font-semibold text-brand-800">{t("campaigns.settings.title")}</p>

            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">{t("campaigns.settings.listLabel")}</label>
              {lists.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {t("campaigns.settings.noLists")}
                </p>
              ) : (
                <select className="w-full border border-brand-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={selectedListId} onChange={(e) => setSelectedListId(e.target.value)}>
                  <option value="">{t("campaigns.settings.selectList")}</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({t("campaigns.settings.contacts", { count: l.total_count })})</option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-700 mb-1">{t("campaigns.settings.dailyLimitLabel")}</label>
              <input type="number" min={10} max={500} className="w-full border border-brand-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={dailyLimit} onChange={(e) => setDailyLimit(Math.max(10, Math.min(500, parseInt(e.target.value) || 100)))} />
              <p className="text-xs text-brand-600 mt-1">{t("campaigns.settings.dailyLimitHint")}</p>
            </div>

            {selectedList && estimatedDays !== null && (
              <div className="rounded-lg bg-white border border-brand-100 px-3 py-2 text-xs text-brand-700 flex items-center justify-between">
                <span>{t("campaigns.settings.contacts", { count: selectedList.total_count })}</span>
                <span className="font-semibold">
                  {estimatedDays === 1
                    ? t("campaigns.settings.estimatedDays", { days: estimatedDays })
                    : t("campaigns.settings.estimatedDaysPlural", { days: estimatedDays })}
                </span>
              </div>
            )}
          </div>

          {launchError && <p className="text-red-600 text-sm">{launchError}</p>}
          {successMsg && <p className="text-teal text-sm font-medium">{successMsg}</p>}

          <button onClick={() => void handleLaunch()} disabled={launching || !selectedListId} className="w-full bg-teal text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {launching ? (<><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>{t("campaigns.settings.launching")}</>) : t("campaigns.settings.launch")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Campaigns Panel ───────────────────────────────────────────────────────────

function CampaignsPanel({ refreshKey }: { refreshKey: number }) {
  const t = useTranslations("smartSendPage");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getCampaigns().then(setCampaigns).catch(() => {}).finally(() => setLoading(false));
  }, [refreshKey]);

  async function handlePause(id: string) {
    setActionLoading(id);
    try {
      const updated = await pauseCampaign(id);
      setCampaigns((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } catch { /* ignore */ } finally { setActionLoading(null); }
  }

  async function handleResume(id: string) {
    setActionLoading(id);
    try {
      const updated = await resumeCampaign(id);
      setCampaigns((prev) => prev.map((c) => c.id === updated.id ? updated : c));
    } catch { /* ignore */ } finally { setActionLoading(null); }
  }

  if (loading) return <p className="text-sm text-gray-400">{t("campaigns.loading")}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("campaigns.title")}</h2>
        <p className="text-sm text-gray-500">{t("campaigns.description")}</p>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{t("campaigns.empty")}</p>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{c.subject}</p>
                  {c.list_name && <p className="text-xs text-gray-500">{c.list_name}</p>}
                </div>
                <StatusBadge status={c.status} />
              </div>

              <ProgressBar value={c.total_sent} max={c.total_contacts} />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {t("campaigns.sentOf", { sent: c.total_sent, total: c.total_contacts })}
                  {c.total_failed > 0 ? ` ${t("campaigns.failedCount", { count: c.total_failed })}` : ""}
                </span>
                {c.status === "active" && c.estimated_days_remaining > 0 && (
                  <span>{t("campaigns.remaining", { days: c.estimated_days_remaining, limit: c.daily_limit })}</span>
                )}
              </div>

              {(c.status === "active" || c.status === "paused") && (
                <div className="flex gap-2">
                  {c.status === "active" ? (
                    <button onClick={() => void handlePause(c.id)} disabled={actionLoading === c.id} className="flex-1 border border-amber-200 text-amber-700 rounded-lg py-1.5 text-xs font-semibold hover:bg-amber-50 disabled:opacity-50">
                      {actionLoading === c.id ? "…" : `⏸ ${t("campaigns.pause")}`}
                    </button>
                  ) : (
                    <button onClick={() => void handleResume(c.id)} disabled={actionLoading === c.id} className="flex-1 border border-emerald-200 text-emerald-700 rounded-lg py-1.5 text-xs font-semibold hover:bg-emerald-50 disabled:opacity-50">
                      {actionLoading === c.id ? "…" : `▶ ${t("campaigns.resume")}`}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History Panel ─────────────────────────────────────────────────────────────

function HistoryPanel() {
  const t = useTranslations("smartSendPage");
  const [items, setItems] = useState<SendHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory().then(setItems).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">{t("loading")}</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("history.title")}</h2>
        <p className="text-sm text-gray-500">{t("history.description")}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">{t("history.empty")}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="border rounded-xl p-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.job_title}{item.company_name && <span className="text-gray-400 font-normal"> — {item.company_name}</span>}</p>
                  <p className="text-xs text-gray-500 truncate">{item.recipient_email}</p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <p className="text-xs text-gray-400 truncate">{item.subject}</p>
              {item.error_message && <p className="text-xs text-rose-600 truncate">{item.error_message}</p>}
              <p className="text-xs text-gray-300">{new Date(item.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SmartSendPage() {
  const t = useTranslations("smartSendPage");

  const [gmailStatus, setGmailStatus] = useState<GmailStatus>({ is_connected: false, gmail_address: null });
  const [step, setStep] = useState<Step>("connect");
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [campaignRefreshKey, setCampaignRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("gmail_connected") || params.has("gmail_error")) {
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
    getGmailStatus()
      .then((s) => { setGmailStatus(s); if (s.is_connected) setStep("compose"); })
      .catch(() => {})
      .finally(() => setLoadingStatus(false));
  }, []);

  const tabs: { id: Step; label: string; disabled?: boolean }[] = [
    { id: "connect",   label: gmailStatus.is_connected ? t("tabs.gmailVerified") : t("tabs.gmail") },
    { id: "compose",   label: t("tabs.compose"),             disabled: !gmailStatus.is_connected },
    { id: "campaigns", label: t("campaigns.tab"),            disabled: !gmailStatus.is_connected },
    { id: "history",   label: t("tabs.history") },
  ];

  if (loadingStatus) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-sm text-gray-400">{t("loading")}</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-700 mb-1">{t("eyebrow")}</p>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("description")}</p>
      </div>

      <Panel>
        <div className="flex border-b mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id)}
              disabled={tab.disabled}
              className={`flex-1 py-2.5 text-sm font-medium border-b-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                step === tab.id ? "border-brand-700 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {step === "connect" && (
          <GmailConnectPanel
            status={gmailStatus}
            onConnected={() => setStep("compose")}
            onDisconnected={() => { setGmailStatus({ is_connected: false, gmail_address: null }); setStep("connect"); }}
          />
        )}

        {step === "compose" && gmailStatus.is_connected && (
          <ComposePanel
            gmailAddress={gmailStatus.gmail_address!}
            onLaunched={() => { setCampaignRefreshKey((k) => k + 1); setStep("campaigns"); }}
          />
        )}

        {step === "campaigns" && (
          <CampaignsPanel refreshKey={campaignRefreshKey} />
        )}

        {step === "history" && <HistoryPanel />}
      </Panel>
    </main>
  );
}
