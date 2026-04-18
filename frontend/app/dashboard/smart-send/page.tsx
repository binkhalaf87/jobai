"use client";
// Smart Send — Gmail SMTP + AI cover letters + live send stream
import { useEffect, useRef, useState } from "react";

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
    draft: "bg-gray-100 text-gray-600",
    sending: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
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
      setOk("Saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
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
      setOk("Connection verified.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Gmail setup</h2>
        <p className="text-sm text-gray-500">
          Connect Gmail once, then generate and send faster.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 space-y-1">
        <p className="font-medium">Create a Gmail App Password:</p>
        <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
          <li>Enable 2-Step Verification on your Google account</li>
          <li>Go to Google Account → Security → App Passwords</li>
          <li>Select app: Mail, device: Other → type &quot;JobAI&quot;</li>
          <li>Copy the 16-character password and paste it below</li>
        </ol>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Gmail address</label>
          <input
            type="email"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@gmail.com"
            value={form.gmail_address}
            onChange={(e) => setForm({ ...form, gmail_address: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Display name</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your Name"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            App Password{" "}
            <span className="text-gray-400 font-normal">(16 characters, spaces ignored)</span>
          </label>
          <input
            type="password"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="xxxx xxxx xxxx xxxx"
            value={form.app_password}
            onChange={(e) => setForm({ ...form, app_password: e.target.value })}
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {ok && <p className="text-green-600 text-sm">{ok}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : conn ? "Update" : "Save"}
          </button>
          {conn && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="flex-1 border border-blue-600 text-blue-600 rounded-lg py-2 text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Test"}
            </button>
          )}
        </div>
      </form>

      {conn && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500">
            Current:{" "}
            <span className="font-medium text-gray-700">{conn.gmail_address}</span>
            {conn.is_verified && (
              <span className="ml-2 text-green-600 text-xs font-medium">✓ Verified</span>
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
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Compose Outreach Email</h2>
        <p className="text-sm text-gray-500">
          AI generates 3 variants: Formal, Creative, and Concise. Edit before sending.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Title *</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Software Engineer"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Company Name</label>
          <input
            type="text"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional"
            value={form.company_name}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          />
        </div>
        {resumes.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Resume <span className="text-gray-400 font-normal">(optional — helps tailor the letter)</span>
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.resume_id}
              onChange={(e) => setForm({ ...form, resume_id: e.target.value })}
            >
              <option value="">No resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.source_filename ?? r.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">Job Description</label>
          <textarea
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Paste the job description to tailor the email (optional)"
            value={form.job_description}
            onChange={(e) => setForm({ ...form, job_description: e.target.value })}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={generating || !form.job_title.trim()}
          className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating 3 variants…
            </>
          ) : (
            "Generate Letters"
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
      setRecipientError("Enter a valid email address");
      return;
    }
    if (recipients.some((r) => r.email.toLowerCase() === email.toLowerCase())) {
      setRecipientError("Already added");
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
      setError("Add at least one recipient");
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
      setError(err instanceof Error ? err.message : "Failed to confirm");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Review &amp; Send</h2>
        <p className="text-sm text-gray-500">Choose a variant, edit, add recipients, then send.</p>
      </div>

      <div className="flex gap-2">
        {(["formal", "creative", "concise"] as Variant[]).map((v) => (
          <button
            key={v}
            onClick={() => selectVariant(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedVariant === v
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={editedSubject}
          onChange={(e) => setEditedSubject(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Body</label>
        <textarea
          rows={10}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
          value={editedBody}
          onChange={(e) => setEditedBody(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Recipients</label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="email@example.com Optional Name"
            value={recipientInput}
            onChange={(e) => setRecipientInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
          />
          <button
            type="button"
            onClick={addRecipient}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        {recipientError && <p className="text-red-500 text-xs mt-1">{recipientError}</p>}
        <p className="text-xs text-gray-400 mt-1">
          Email then optional name separated by space. Max 100.
        </p>
        {recipients.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {recipients.map((r) => (
              <span
                key={r.email}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full"
              >
                {r.name ? `${r.name} <${r.email}>` : r.email}
                <button
                  type="button"
                  onClick={() => removeRecipient(r.email)}
                  className="text-blue-400 hover:text-blue-700 ml-1"
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
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {confirming
          ? "Confirming…"
          : `Send to ${recipients.length} recipient${recipients.length !== 1 ? "s" : ""}`}
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
      setError(err instanceof Error ? err.message : "Send failed");
      setDone(true);
    });
  }, [campaignId]);

  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;
  const progress = total > 0 ? Math.round((logs.length / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Sending…</h2>
        {!done && (
          <p className="text-sm text-gray-500">Emails are being sent one by one. Do not close this page.</p>
        )}
      </div>

      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{logs.length} / {total || "?"}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex gap-4 text-sm">
        <span className="text-green-600 font-medium">{sent} sent</span>
        {failed > 0 && <span className="text-red-600 font-medium">{failed} failed</span>}
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={log.status === "sent" ? "text-green-500" : "text-red-500"}>
              {log.status === "sent" ? "✓" : "✗"}
            </span>
            <span className="text-gray-700 truncate">{log.email}</span>
            {log.error && <span className="text-red-400 truncate">— {log.error}</span>}
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {done && (
        <div className="space-y-3">
          {summary && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
              Campaign complete — {summary.sent} sent
              {summary.failed > 0 && `, ${summary.failed} failed`}
            </div>
          )}
          <button
            onClick={onDone}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700"
          >
            View History
          </button>
        </div>
      )}
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400">Loading history…</p>;

  if (campaigns.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-sm">No campaigns yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Campaign History</h2>
      {campaigns.map((c) => (
        <div key={c.id} className="border rounded-lg overflow-hidden">
          <button
            className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
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
            <div className="border-t px-4 py-3 bg-gray-50 space-y-3">
              <div className="flex gap-6 text-xs text-gray-500 flex-wrap">
                <span>Variant: <strong>{c.selected_variant ?? "—"}</strong></span>
                <span>Total: <strong>{c.total_recipients}</strong></span>
                <span className="text-green-600">Sent: <strong>{c.sent_count}</strong></span>
                {c.failed_count > 0 && (
                  <span className="text-red-600">Failed: <strong>{c.failed_count}</strong></span>
                )}
              </div>
              {c.subject && (
                <p className="text-xs text-gray-600">
                  <strong>Subject:</strong> {c.subject}
                </p>
              )}
              {c.logs.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-0.5">
                  {c.logs.map((log) => (
                    <div key={log.id} className="flex items-center gap-2 text-xs">
                      <span className={log.status === "sent" ? "text-green-500" : "text-red-500"}>
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
        setSmtpLoadError(err instanceof Error ? err.message : "Failed to load Gmail setup.");
      })
      .finally(() => setSmtpLoading(false));
  }, []);

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
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    );
  }

  const tabs: { id: Step; label: string }[] = [
    { id: "compose", label: "Compose" },
    { id: "history", label: "History" },
    { id: "smtp", label: smtpConn ? (smtpConn.is_verified ? "Gmail ✓" : "Gmail") : "Gmail Setup" },
  ];
  const connectionLabel = !smtpConn ? "Setup needed" : smtpConn.is_verified ? "Verified" : "Saved, verify next";
  const connectionDescription = !smtpConn
    ? "Add your Gmail SMTP connection before sending campaigns."
    : smtpConn.is_verified
      ? `Ready to send from ${smtpConn.gmail_address}.`
      : "Connection exists, but verification should be completed before live sending.";
  const campaignStateLabel =
    step === "preview" || step === "sending"
      ? "Campaign in progress"
      : campaignId && letters
        ? "Draft ready"
        : "No campaign drafted";
  const campaignStateDescription =
    step === "preview" || step === "sending"
      ? "Review the generated variants and control batch sending from one place."
      : campaignId && letters
        ? "You already have AI-generated email variants ready for preview."
        : "Start with a target role and company details, then generate personalized outreach.";

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_42%),linear-gradient(135deg,_#ffffff_0%,_#eff6ff_46%,_#f8fafc_100%)] px-6 py-6 md:px-8 md:py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Application Outreach</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Smart Send campaigns</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              Turn a target job into a guided outreach flow: generate tailored email copy, review variants, and send in controlled batches from your Gmail account.
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Connection</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{connectionLabel}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{connectionDescription}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Campaign Status</p>
                <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{campaignStateLabel}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{campaignStateDescription}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/50">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Current Step</p>
                <p className="mt-3 text-lg font-semibold tracking-tight capitalize text-slate-950">{step}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Compose, preview, send, and review history without leaving the campaign flow.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-brand-900 px-6 py-6 text-white lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Recommended Flow</p>
            <div className="mt-4 space-y-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">1. Draft the campaign</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Set the role, company, and job description so the AI can anchor the message correctly.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">2. Verify delivery</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Connect Gmail once, then reuse it across future campaigns and batch sends.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">3. Send with control</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Preview variants first, then watch sent and failed activity move into history.</p>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {smtpLoadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Unable to load Gmail setup right now: {smtpLoadError}
        </div>
      )}

      {step !== "preview" && step !== "sending" && (
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setStep(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                step === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-500 ring-1 ring-slate-200 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {(step === "preview" || step === "sending") && (
        <button
          onClick={() => setStep(step === "preview" ? "compose" : "history")}
          className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          ← {step === "preview" ? "Back to Compose" : "Back to History"}
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
