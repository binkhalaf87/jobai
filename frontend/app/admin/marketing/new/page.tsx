"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Upload, CheckCircle } from "lucide-react";
import {
  createCampaign,
  importContacts,
  activateCampaign,
  downloadTemplate,
} from "@/lib/marketing";

const WARMUP_SCHEDULE = [
  { period: "Days 1–3",  limit: "500 / day" },
  { period: "Days 4–7",  limit: "1,000 / day" },
  { period: "Days 8–14", limit: "3,000 / day" },
  { period: "Days 15–21", limit: "8,000 / day" },
  { period: "Days 22–28", limit: "20,000 / day" },
  { period: "Day 29+",   limit: "50,000 / day" },
];

type Step = "details" | "import" | "activate";

export default function NewCampaignPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("details");

  // Step 1
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [fromName, setFromName] = useState("JobAI24");
  const [fromEmail, setFromEmail] = useState("marketing@jobai24.com");

  // Step 2
  const [campaignId, setCampaignId] = useState("");
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim() || !htmlBody.trim()) return;
    setLoading(true); setError("");
    try {
      const c = await createCampaign({ name: name.trim(), subject: subject.trim(), html_body: htmlBody.trim(), from_name: fromName.trim(), from_email: fromEmail.trim() });
      setCampaignId(c.id);
      setStep("import");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function handleImport(file: File) {
    setLoading(true); setError("");
    try {
      const result = await importContacts(campaignId, file);
      setImportResult(result);
    } catch (e) { setError(e instanceof Error ? e.message : "Import failed"); }
    finally { setLoading(false); }
  }

  async function handleActivate() {
    setLoading(true); setError("");
    try {
      await activateCampaign(campaignId);
      router.push("/admin/marketing");
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to activate"); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Marketing Campaign</h1>
          <p className="text-xs text-slate-500">Bulk email with automatic domain warm-up</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-2">
        {(["details", "import", "activate"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step === s ? "bg-slate-900 text-white" : i < ["details","import","activate"].indexOf(step) ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
              {i < ["details","import","activate"].indexOf(step) ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-medium ${step === s ? "text-slate-900" : "text-slate-400"}`}>
              {s === "details" ? "Details" : s === "import" ? "Import Contacts" : "Activate"}
            </span>
            {i < 2 && <div className="h-px w-6 bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Campaign Details ── */}
      {step === "details" && (
        <form onSubmit={(e) => void handleCreateCampaign(e)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Campaign Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. June Job Seekers Outreach"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">From Name</label>
              <input value={fromName} onChange={(e) => setFromName(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">From Email</label>
              <input type="email" value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Subject Line</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="e.g. وظائف جديدة تنتظرك على منصة JobAI24"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Body (HTML)</label>
            <textarea value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} required rows={10}
              placeholder="<html>...</html>"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 resize-y" />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {loading ? "Creating…" : "Continue →"}
          </button>
        </form>
      )}

      {/* ── Step 2: Import Contacts ── */}
      {step === "import" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Import contacts from Excel</p>
          <p className="text-xs text-slate-500">
            The file must have an <code className="rounded bg-slate-100 px-1">email</code> column.
            Optional: <code className="rounded bg-slate-100 px-1">full_name</code>
          </p>

          <button
            onClick={() => downloadTemplate()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download size={13} /> Download Template
          </button>

          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImport(f); }} />

          {!importResult ? (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-sm font-semibold text-slate-500 hover:border-slate-400 disabled:opacity-50"
            >
              <Upload size={18} />
              {loading ? "Importing…" : "Click to upload Excel file"}
            </button>
          ) : (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm">
              <p className="font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle size={16} /> Import Complete
              </p>
              <p className="mt-1 text-emerald-700">Added: <strong>{importResult.added.toLocaleString()}</strong> contacts</p>
              {importResult.skipped > 0 && <p className="text-emerald-600">Skipped (invalid/duplicate): {importResult.skipped.toLocaleString()}</p>}
            </div>
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}

          {importResult && (
            <button onClick={() => setStep("activate")} className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white">
              Continue →
            </button>
          )}
        </div>
      )}

      {/* ── Step 3: Activate ── */}
      {step === "activate" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">Review warm-up schedule & activate</p>

          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Period</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Daily Limit</th>
                </tr>
              </thead>
              <tbody>
                {WARMUP_SCHEDULE.map(({ period, limit }, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-3 py-2 text-slate-700">{period}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{limit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            Make sure <strong>BREVO_API_KEY</strong> is set in your Railway environment variables before activating.
          </div>

          {error && <p className="text-xs text-rose-600">{error}</p>}

          <button onClick={() => void handleActivate()} disabled={loading}
            className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Activating…" : "Activate Campaign"}
          </button>
        </div>
      )}
    </div>
  );
}
