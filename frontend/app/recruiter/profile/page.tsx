"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserCircle, Mail, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";

import {
  getSmtpConnection,
  saveSmtpConnection,
  verifySmtpConnection,
  deleteSmtpConnection,
} from "@/lib/smart-send";
import type { SmtpConnection } from "@/types";

// ─── Types ────────────────────────────���───────────────────────���───────────────

type Tab = "profile" | "send-settings";

// ─── Gmail SMTP Setup ─────────────────────────���───────────────────────────────

function SendSettingsTab() {
  const [conn, setConn] = useState<SmtpConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ gmail_address: "", display_name: "", app_password: "" });
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getSmtpConnection()
      .then((c) => {
        setConn(c);
        if (c) setForm({ gmail_address: c.gmail_address, display_name: c.display_name ?? "", app_password: "" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function clear() { setError(null); setSuccess(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    clear();
    setSaving(true);
    try {
      const saved = await saveSmtpConnection(form);
      setConn(saved);
      setSuccess("Connection saved. Click Verify to test it.");
      setForm((f) => ({ ...f, app_password: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    clear();
    setVerifying(true);
    try {
      await verifySmtpConnection();
      const fresh = await getSmtpConnection();
      setConn(fresh);
      setSuccess("Connection verified successfully. You can now send interview invites.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Check your App Password.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleRemove() {
    clear();
    setRemoving(true);
    try {
      await deleteSmtpConnection();
      setConn(null);
      setForm({ gmail_address: "", display_name: "", app_password: "" });
      setConfirmRemove(false);
      setSuccess("Connection removed.");
    } catch {
      setError("Failed to remove connection.");
    } finally {
      setRemoving(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-900/8";

  return (
    <div className="space-y-6">

      {/* Status banner */}
      {!loading && (
        <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
          conn?.is_verified
            ? "border-emerald-200 bg-emerald-50"
            : conn
            ? "border-amber-200 bg-amber-50"
            : "border-slate-200 bg-slate-50"
        }`}>
          {conn?.is_verified ? (
            <CheckCircle2 size={15} className="flex-shrink-0 text-emerald-600" />
          ) : conn ? (
            <AlertCircle size={15} className="flex-shrink-0 text-amber-600" />
          ) : (
            <Mail size={15} className="flex-shrink-0 text-slate-400" />
          )}
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-semibold ${
              conn?.is_verified ? "text-emerald-700" : conn ? "text-amber-700" : "text-slate-600"
            }`}>
              {conn?.is_verified
                ? `Verified — sending from ${conn.gmail_address}`
                : conn
                ? `Saved but not verified — click Verify to test`
                : "No Gmail connection set up"}
            </p>
            {!conn && (
              <p className="text-xs text-slate-400 mt-0.5">Required for sending AI interview invites to candidates.</p>
            )}
          </div>
        </div>
      )}

      {/* How-to */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-xs text-violet-800 space-y-1.5">
        <p className="font-bold">How to create a Gmail App Password:</p>
        <ol className="list-decimal list-inside space-y-1 text-violet-700">
          <li>Enable 2-Step Verification on your Google account</li>
          <li>Go to Google Account → Security → App Passwords</li>
          <li>Select app: Mail, device: Other → type "JobAI"</li>
          <li>Copy the 16-character password and paste it below</li>
        </ol>
      </div>

      {/* Form */}
      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Gmail Address</label>
            <input
              type="email"
              value={form.gmail_address}
              onChange={(e) => setForm({ ...form, gmail_address: e.target.value })}
              placeholder="you@gmail.com"
              required
              className={inputCls}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Display Name</label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="e.g. HR Team — Acme Corp"
              required
              className={inputCls}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">
            App Password
            <span className="ml-1.5 font-normal text-slate-400">(16 characters)</span>
          </label>
          <input
            type="password"
            value={form.app_password}
            onChange={(e) => setForm({ ...form, app_password: e.target.value })}
            placeholder={conn ? "Leave blank to keep existing password" : "xxxx xxxx xxxx xxxx"}
            required={!conn}
            className={inputCls}
          />
        </div>

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

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : conn ? "Update Connection" : "Save Connection"}
          </button>

          {conn && (
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={verifying}
              className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {verifying ? "Verifying…" : conn.is_verified ? "Re-Verify" : "Verify Connection"}
            </button>
          )}

          {conn && !confirmRemove && (
            <button
              type="button"
              onClick={() => setConfirmRemove(true)}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 transition hover:border-rose-200 hover:text-rose-500"
            >
              <Trash2 size={12} /> Remove
            </button>
          )}
          {confirmRemove && (
            <>
              <span className="ml-auto text-xs font-medium text-rose-600">Remove this connection?</span>
              <button
                type="button"
                onClick={() => void handleRemove()}
                disabled={removing}
                className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {removing ? "…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Page ────────────────────────────���───────────────────────────────────���────

export default function RecruiterProfilePage() {
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
    { key: "profile",       label: "Profile" },
    { key: "send-settings", label: "Send Settings" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <UserCircle size={16} className="text-slate-400" />
        <p className="text-[15px] font-bold tracking-tight text-slate-900">Account Settings</p>
      </div>

      {/* ── Tabs ── */}
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

      {/* ── Tab content ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
        {activeTab === "profile" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-900">Recruiter Account</p>
            <p className="text-sm leading-6 text-slate-500">
              Profile editing coming soon. Contact support to update your account details.
            </p>
          </div>
        )}
        {activeTab === "send-settings" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Gmail SMTP Connection</p>
              <p className="mt-1 text-xs text-slate-500">
                Used to send AI interview invites directly to candidates from your Gmail account.
              </p>
            </div>
            <SendSettingsTab />
          </div>
        )}
      </div>

    </div>
  );
}
