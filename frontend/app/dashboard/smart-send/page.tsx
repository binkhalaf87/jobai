"use client";
// Smart Send — Gmail SMTP + AI cover letters + live send stream
import { useEffect, useRef, useState } from "react";

import { useTranslations } from "next-intl";

import { Panel } from "@/components/panel";
import {
  confirmCampaign,
  generateLetters,
  getSmtpConnection,
  listCampaigns,
  saveSmtpConnection,
  streamCampaignSend,
  verifySmtpConnection,
} from "@/lib/smart-send";
import type {
  Campaign,
  GeneratedLetters,
  LetterVariant,
  RecipientIn,
  SmtpConnection,
} from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "smtp" | "compose" | "preview" | "sending" | "history";
type Variant = "formal" | "creative" | "concise";

type SendProgress = {
  index: number;
  total: number;
  email: string;
  status: "sent" | "failed";
  error?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600 border border-slate-200",
    sending: "bg-brand-50 text-brand-700 border border-brand-200",
    completed: "bg-teal-light/30 text-teal border border-teal-light",
    failed: "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

// ─── SMTP Setup Panel ─────────────────────────────────────────────────────────

function SmtpSetup({
  conn,
  onSaved,
}: {
  conn: SmtpConnection | null;
  onSaved: (c: SmtpConnection) => void;
}) {
  const t = useTranslations("smartSendPage");
  const [form, setForm] = useState({
    gmail_address: conn?.gmail_address ?? "",
    display_name: conn?.display_name ?? "",
    app_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk("");
    setSaving(true);
    try {
      const saved = await saveSmtpConnection(form);
      onSaved(saved);
      setOk(t("smtpSetup.saved"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("smtpSetup.failedToSave"));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setError("");
    setOk("");
    setVerifying(true);
    try {
      await verifySmtpConnection();
      setOk(t("smtpSetup.connectionVerified"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("smtpSetup.verificationFailed"));
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("smtpSetup.title")}</h2>
        <p className="text-sm text-gray-500">
          {t("smtpSetup.description")}
        </p>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-sm text-brand-800 space-y-1">
        <p className="font-medium">{t("smtpSetup.instructionsTitle")}</p>
        <ol className="list-decimal list-inside space-y-0.5 text-brand-700">
          <li>{t("smtpSetup.step1")}</li>
          <li>{t("smtpSetup.step2")}</li>
          <li>{t("smtpSetup.step3")}</li>
          <li>{t("smtpSetup.step4")}</li>
        </ol>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("smtpSetup.gmailAddress")}</label>
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={t("smtpSetup.gmailPlaceholder")}
            value={form.gmail_address}
            onChange={(e) => setForm({ ...form, gmail_address: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("smtpSetup.displayName")}</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={t("smtpSetup.displayNamePlaceholder")}
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            {t("smtpSetup.appPassword")}{" "}
            <span className="text-gray-400 font-normal">{t("smtpSetup.appPasswordHint")}</span>
          </label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={t("smtpSetup.appPasswordPlaceholder")}
            value={form.app_password}
            onChange={(e) => setForm({ ...form, app_password: e.target.value })}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {ok && <p className="text-teal text-sm">{ok}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-brand-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? t("smtpSetup.saving") : conn ? t("smtpSetup.update") : t("smtpSetup.save")}
          </button>
          {conn && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="flex-1 border border-brand-300 text-brand-700 rounded-lg py-2 text-sm font-medium hover:bg-brand-50 disabled:opacity-50"
            >
              {verifying ? t("smtpSetup.verifying") : t("smtpSetup.test")}
            </button>
          )}
        </div>
      </form>

      {conn && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">
            {t("smtpSetup.current")}{" "}
            <span className="font-medium text-gray-700">{conn.gmail_address}</span>
            {conn.is_verified && (
              <span className="ml-2 text-teal text-xs font-medium">{t("smtpSetup.verified")}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Compose Panel ─────────────────────────────────────────────────────────────

function ComposePanel({
  onGenerated,
}: {
  onGenerated: (campaignId: string, letters: GeneratedLetters) => void;
}) {
  const t = useTranslations("smartSendPage");
  const [form, setForm] = useState({
    job_title: "",
    company_name: "",
    job_description: "",
    resume_id: "",
  });
  const [resumes, setResumes] = useState<import("@/types").ResumeListItem[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    import("@/lib/resumes").then(({ listResumes }) =>
      listResumes().then(setResumes).catch(() => {})
    );
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const jobTitle = sessionStorage.getItem("jobai_smartsend_job_title");
    const companyName = sessionStorage.getItem("jobai_smartsend_company_name");
    const jobDescription = sessionStorage.getItem("jobai_smartsend_job_description");

    if (jobTitle || companyName || jobDescription) {
      setForm((prev) => ({
        ...prev,
        job_title: jobTitle ?? prev.job_title,
        company_name: companyName ?? prev.company_name,
        job_description: jobDescription ?? prev.job_description,
      }));
    }

    sessionStorage.removeItem("jobai_smartsend_job_title");
    sessionStorage.removeItem("jobai_smartsend_company_name");
    sessionStorage.removeItem("jobai_smartsend_job_description");
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGenerating(true);
    try {
      const res = await generateLetters({
        job_title: form.job_title,
        company_name: form.company_name || undefined,
        job_description: form.job_description || undefined,
        resume_id: form.resume_id || undefined,
      });
      onGenerated(res.campaign_id, res.letters);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("compose.generationFailed"));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("compose.title")}</h2>
        <p className="text-sm text-gray-500">
          {t("compose.description")}
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("compose.jobTitle")}</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={t("compose.jobTitlePlaceholder")}
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("compose.companyName")}</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={t("compose.companyOptional")}
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
        </div>
        {resumes.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("compose.resumeLabel")} <span className="text-gray-400 font-normal">{t("compose.resumeOptional")}</span>
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={form.resume_id}
              onChange={(e) => setForm({ ...form, resume_id: e.target.value })}
            >
              <option value="">{t("compose.noResume")}</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.source_filename ?? r.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">{t("compose.jobDescription")}</label>
          <textarea
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            placeholder={t("compose.jdPlaceholder")}
            value={form.job_description}
            onChange={(e) => setForm({ ...form, job_description: e.target.value })}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={generating || !form.job_title.trim()}
          className="w-full bg-brand-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              {t("compose.generating")}
            </>
          ) : (
            t("compose.generateBtn")
          )}
        </button>
      </form>
    </div>
  );
}

// ─── Preview & Send Panel ──────────────────────────────────────────────────────

function PreviewPanel({
  campaignId,
  letters,
  onSent,
}: {
  campaignId: string;
  letters: GeneratedLetters;
  onSent: () => void;
}) {
  const t = useTranslations("smartSendPage");
  const [selectedVariant, setSelectedVariant] = useState<Variant>("formal");
  const [editedSubject, setEditedSubject] = useState(letters.formal.subject);
  const [editedBody, setEditedBody] = useState(letters.formal.body);
  const [recipientInput, setRecipientInput] = useState("");
  const [recipients, setRecipients] = useState<RecipientIn[]>([]);
  const [recipientError, setRecipientError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const variantData: Record<Variant, LetterVariant> = {
    formal: letters.formal,
    creative: letters.creative,
    concise: letters.concise,
  };

  function selectVariant(v: Variant) {
    setSelectedVariant(v);
    setEditedSubject(variantData[v].subject);
    setEditedBody(variantData[v].body);
  }

  function addRecipient() {
    setRecipientError("");
    const parts = recipientInput.trim().split(/\s+/);
    const email = parts[0];
    const name = parts.slice(1).join(" ") || undefined;
    if (!email.includes("@")) {
      setRecipientError(t("preview.invalidEmail"));
      return;
    }
    if (recipients.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
      setRecipientError(t("preview.alreadyAdded"));
      return;
    }
    setRecipients([...recipients, { email: email.toLowerCase(), name }]);
    setRecipientInput("");
  }

  function removeRecipient(email: string) {
    setRecipients(recipients.filter((r) => r.email !== email));
  }

  async function handleConfirm() {
    if (recipients.length === 0) {
      setError(t("preview.atLeastOne"));
      return;
    }
    setError("");
    setConfirming(true);
    try {
      await confirmCampaign(campaignId, {
        selected_variant: selectedVariant,
        subject: editedSubject,
        body: editedBody,
        recipients,
      });
      onSent();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("preview.failedToConfirm"));
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("preview.title")}</h2>
        <p className="text-sm text-gray-500">{t("preview.description")}</p>
      </div>

      <div className="flex gap-2">
        {(["formal", "creative", "concise"] as Variant[]).map((v) => (
          <button
            key={v}
            onClick={() => selectVariant(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedVariant === v
                ? "bg-brand-800 text-white border-brand-800"
                : "bg-white text-gray-600 border-slate-200 hover:border-brand-400"
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("preview.subject")}</label>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          value={editedSubject}
          onChange={(e) => setEditedSubject(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("preview.body")}</label>
        <textarea
          rows={10}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono"
          value={editedBody}
          onChange={(e) => setEditedBody(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("preview.recipients")}</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder={t("preview.recipientPlaceholder")}
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
          />
          <button
            type="button"
            onClick={addRecipient}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm hover:bg-slate-200"
          >
            {t("preview.addBtn")}
          </button>
        </div>
        {recipientError && <p className="text-red-500 text-xs mt-1">{recipientError}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {t("preview.recipientHint")}
        </p>
        {recipients.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {recipients.map((r) => (
              <span
                key={r.email}
                className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-full"
              >
                {r.name ? `${r.name} <${r.email}>` : r.email}
                <button
                  type="button"
                  onClick={() => removeRecipient(r.email)}
                  className="text-brand-300 hover:text-brand-700 ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleConfirm}
        disabled={confirming || recipients.length === 0}
        className="w-full bg-teal text-white rounded-lg py-2 text-sm font-medium hover:bg-teal/90 disabled:opacity-50"
      >
        {confirming
          ? t("preview.confirming")
          : t("preview.sendTo", { count: recipients.length })}
      </button>
    </div>
  );
}

// ─── Sending Panel ────────────────────────────────────────────────────────────

function SendingPanel({
  campaignId,
  onDone,
}: {
  campaignId: string;
  onDone: () => void;
}) {
  const t = useTranslations("smartSendPage");
  const [logs, setLogs] = useState<SendProgress[]>([]);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    streamCampaignSend(campaignId, (event) => {
      if (event.type === "start") {
        setTotal(event.total);
      } else if (event.type === "progress") {
        setLogs((prev) => [
          ...prev,
          { index: event.index, total: event.total, email: event.email, status: event.status, error: event.error },
        ]);
      } else if (event.type === "done") {
        setSummary({ sent: event.sent, failed: event.failed });
        setDone(true);
      } else if (event.type === "error") {
        setError(event.message);
        setDone(true);
      }
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : t("sending.sendFailed"));
      setDone(true);
    });
  }, [campaignId, t]);

  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const progress = total > 0 ? Math.round((logs.length / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("sending.title")}</h2>
        {!done && (
          <p className="text-sm text-gray-500">{t("sending.doNotClose")}</p>
        )}
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{logs.length} / {total || "?"}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-brand-700 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-teal font-medium">{t("sending.sent", { count: sent })}</span>
        {failed > 0 && <span className="text-red-600 font-medium">{t("sending.failed", { count: failed })}</span>}
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {logs.map((log, i) => (
          <div key={i} className="flex flex-col gap-0.5 text-xs">
            <div className="flex items-center gap-2">
              <span className={log.status === "sent" ? "text-teal" : "text-red-500"}>
                {log.status === "sent" ? "✓" : "✗"}
              </span>
              <span className="text-gray-700">{log.email}</span>
            </div>
            {log.status === "failed" && (
              <p className="text-red-400 ml-4 break-all">{log.error || t("sending.noErrorMessage")}</p>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {done && (
        <div className="space-y-3">
          {summary && (
            <div className="bg-teal-light/20 border border-teal-light rounded-xl p-4 text-sm text-teal">
              {t("sending.campaignComplete", { sent: summary.sent })}
              {summary.failed > 0 && t("sending.campaignWithFailed", { failed: summary.failed })}
            </div>
          )}
          <button
            onClick={onDone}
            className="w-full bg-brand-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-brand-700"
          >
            {t("sending.viewHistory")}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const t = useTranslations("smartSendPage");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">{t("history.loading")}</p>;

  if (campaigns.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-sm">{t("history.noCampaigns")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{t("history.title")}</h2>
      {campaigns.map((c) => (
        <div key={c.id} className="border rounded-lg overflow-hidden">
          <button
            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50"
            onClick={() => setExpanded(expanded === c.id ? null : c.id)}
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={c.status} />
              <div>
                <p className="text-sm font-medium">{c.job_title}</p>
                {c.company_name && <p className="text-xs text-gray-400">{c.company_name}</p>}
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>{c.sent_count}/{c.total_recipients} sent</p>
              <p>{new Date(c.created_at).toLocaleDateString()}</p>
            </div>
          </button>
          {expanded === c.id && (
            <div className="border-t px-4 py-3 bg-slate-50 space-y-3">
              <div className="flex gap-6 text-xs text-gray-500 flex-wrap">
                <span>{t("history.variant")} <strong>{c.selected_variant ?? "—"}</strong></span>
                <span>{t("history.total")} <strong>{c.total_recipients}</strong></span>
                <span className="text-teal">{t("history.sent")} <strong>{c.sent_count}</strong></span>
                {c.failed_count > 0 && (
                  <span className="text-red-600">{t("history.failed")} <strong>{c.failed_count}</strong></span>
                )}
              </div>
              {c.subject && (
                <p className="text-xs text-gray-600">
                  <strong>{t("history.subject")}</strong> {c.subject}
                </p>
              )}
              {c.logs.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {c.logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs">
                      <span className={log.status === "sent" ? "text-teal" : "text-red-500"}>
                        {log.status === "sent" ? "✓" : "✗"}
                      </span>
                      <span className="text-gray-600 truncate">
                        {log.recipient_name
                          ? `${log.recipient_name} <${log.recipient_email}>`
                          : log.recipient_email}
                      </span>
                      {log.error_message && (
                        <span className="text-red-400 truncate">— {log.error_message}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SmartSendPage() {
  const t = useTranslations("smartSendPage");
  const [step, setStep] = useState<Step>("compose");
  const [smtpConn, setSmtpConn] = useState<SmtpConnection | null>(null);
  const [smtpLoading, setSmtpLoading] = useState(true);
  const [smtpLoadError, setSmtpLoadError] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [letters, setLetters] = useState<GeneratedLetters | null>(null);

  useEffect(() => {
    getSmtpConnection()
      .then((connection) => {
        setSmtpConn(connection);
        setSmtpLoadError("");
      })
      .catch((err: unknown) => {
        setSmtpLoadError(err instanceof Error ? err.message : t("history.unableToLoad", { error: "" }));
      })
      .finally(() => setSmtpLoading(false));
  }, [t]);

  function handleGenerated(id: string, l: GeneratedLetters) {
    if (!smtpConn) {
      setCampaignId(id);
      setLetters(l);
      setStep("smtp");
      return;
    }
    setCampaignId(id);
    setLetters(l);
    setStep("preview");
  }

  function handleSmtpSaved(c: SmtpConnection) {
    setSmtpConn(c);
    if (campaignId && letters) setStep("preview");
  }

  if (smtpLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-gray-400">{t("loading")}</p>
      </div>
    );
  }

  const tabs: { id: Step; label: string }[] = [
    { id: "compose", label: t("tabs.compose") },
    { id: "history", label: t("tabs.history") },
    {
      id: "smtp",
      label: smtpConn
        ? smtpConn.is_verified
          ? t("tabs.gmailVerified")
          : t("tabs.gmail")
        : t("tabs.gmailSetup"),
    },
  ];

  const connectionLabel = !smtpConn
    ? t("connection.setupNeeded")
    : smtpConn.is_verified
      ? t("connection.verified")
      : t("connection.savedVerifyNext");

  const connectionDescription = !smtpConn
    ? t("connection.addGmailBeforeSending")
    : smtpConn.is_verified
      ? t("connection.readyToSend", { email: smtpConn.gmail_address })
      : t("connection.verifyBeforeSending");

  const campaignStateLabel =
    step === "preview" || step === "sending"
      ? t("campaign.inProgress")
      : campaignId && letters
        ? t("campaign.draftReady")
        : t("campaign.noDraft");

  const campaignStateDescription =
    step === "preview" || step === "sending"
      ? t("campaign.inProgressDesc")
      : campaignId && letters
        ? t("campaign.draftReadyDesc")
        : t("campaign.noDraftDesc");

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-gradient-to-br from-brand-800/8 via-white to-teal/5 px-6 py-6 md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">{t("title")}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              {t("description")}
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("connection.label")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{connectionLabel}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{connectionDescription}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("campaign.label")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{campaignStateLabel}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{campaignStateDescription}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("currentStep")}</p>
                <p className="mt-3 text-lg font-semibold tracking-tight capitalize text-slate-950">{step}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {t("currentStepDesc")}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-brand-900 px-6 py-6 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{t("flow.label")}</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("flow.step1Title")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t("flow.step1Desc")}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("flow.step2Title")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t("flow.step2Desc")}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{t("flow.step3Title")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{t("flow.step3Desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {smtpLoadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("history.unableToLoad", { error: smtpLoadError })}
        </div>
      )}

      {step !== "preview" && step !== "sending" && (
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStep(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                step === tab.id
                  ? "bg-brand-800 text-white shadow-sm"
                  : "bg-white text-gray-500 ring-1 ring-slate-200 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {(step === "preview" || step === "sending") && (
        <button
          onClick={() => setStep(step === "preview" ? "compose" : "history")}
          className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          {step === "preview" ? t("backToCompose") : t("backToHistory")}
        </button>
      )}

      <Panel>
        {step === "compose" && <ComposePanel onGenerated={handleGenerated} />}
        {step === "smtp" && <SmtpSetup conn={smtpConn} onSaved={handleSmtpSaved} />}
        {step === "preview" && campaignId && letters && (
          <PreviewPanel campaignId={campaignId} letters={letters} onSent={() => setStep("sending")} />
        )}
        {step === "sending" && campaignId && (
          <SendingPanel campaignId={campaignId} onDone={() => setStep("history")} />
        )}
        {step === "history" && <HistoryPanel />}
      </Panel>
    </div>
  );
}
