"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Mail, Pause, Play, CheckCircle, AlertCircle, Clock, TrendingUp, BarChart2 } from "lucide-react";
import {
  getCampaigns,
  pauseCampaign,
  resumeCampaign,
  type MarketingCampaign,
} from "@/lib/marketing";

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     className: "bg-slate-100 text-slate-600",   icon: Clock },
  active:    { label: "Active",    className: "bg-emerald-100 text-emerald-700", icon: TrendingUp },
  paused:    { label: "Paused",    className: "bg-amber-100 text-amber-700",   icon: Pause },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-700",     icon: CheckCircle },
  error:     { label: "Error",     className: "bg-rose-100 text-rose-700",     icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? STATUS_BADGE.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.className}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-emerald-500 transition-all"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError("");
    try { setCampaigns(await getCampaigns()); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function handlePause(id: string) {
    setActing(id);
    try { setCampaigns((p) => p.map((c) => (c.id === id ? { ...c, status: "paused" } : c))); await pauseCampaign(id); }
    catch { void load(); }
    finally { setActing(null); }
  }

  async function handleResume(id: string) {
    setActing(id);
    try { setCampaigns((p) => p.map((c) => (c.id === id ? { ...c, status: "active" } : c))); await resumeCampaign(id); }
    catch { void load(); }
    finally { setActing(null); }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Marketing Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">Bulk email with automatic domain warm-up</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/marketing/brevo"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <BarChart2 size={15} /> Brevo Analytics
          </Link>
          <Link
            href="/admin/marketing/new"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            <Plus size={15} /> New Campaign
          </Link>
        </div>
      </div>

      {/* Warm-up info */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Auto Warm-up Schedule:</strong>{" "}
        Days 1–3: 500/day → Days 4–7: 1,000 → Days 8–14: 3,000 → Days 15–21: 8,000 → Days 22–28: 20,000 → Day 29+: 50,000/day
      </div>

      {loading && <p className="text-center text-sm text-slate-400 py-12">Loading…</p>}
      {error && <p className="text-center text-sm text-rose-600 py-12">{error}</p>}

      {!loading && campaigns.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <Mail size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No campaigns yet</p>
          <p className="mt-1 text-xs text-slate-400">Create your first bulk marketing campaign</p>
          <Link href="/admin/marketing/new" className="mt-4 inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            <Plus size={14} /> New Campaign
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-0.5 text-xs text-slate-500 truncate">Subject: {c.subject}</p>
                <p className="text-xs text-slate-400">From: {c.from_name} &lt;{c.from_email}&gt;</p>
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                {c.status === "active" && (
                  <button
                    onClick={() => void handlePause(c.id)}
                    disabled={acting === c.id}
                    className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                  >
                    Pause
                  </button>
                )}
                {c.status === "paused" && (
                  <button
                    onClick={() => void handleResume(c.id)}
                    disabled={acting === c.id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    Resume
                  </button>
                )}
                {c.status === "draft" && (
                  <Link
                    href={`/admin/marketing/${c.id}`}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                  >
                    Setup
                  </Link>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-3">
              {[
                { label: "Contacts", value: c.total_contacts.toLocaleString() },
                { label: "Sent", value: c.total_sent.toLocaleString() },
                { label: "Failed", value: c.total_failed.toLocaleString() },
                { label: "Daily limit", value: c.current_daily_limit.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                  <p className="text-base font-bold text-slate-900 tabular-nums">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            {c.total_contacts > 0 && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{c.progress_pct}%</span>
                </div>
                <ProgressBar pct={c.progress_pct} />
              </div>
            )}

            {c.error_message && (
              <p className="mt-2 text-xs text-rose-600">{c.error_message}</p>
            )}

            {c.warmup_start_date && (
              <p className="mt-2 text-xs text-slate-400">
                Warm-up started: {new Date(c.warmup_start_date).toLocaleDateString()}
                {c.last_sent_at && ` · Last sent: ${new Date(c.last_sent_at).toLocaleString()}`}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
