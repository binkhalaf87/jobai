"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { api, getApiBaseUrl } from "@/lib/api";
import { Panel } from "@/components/panel";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "new" | "shortlisted" | "interview" | "rejected";

type JobMatch = {
  job_id: string;
  job_title: string;
  overall_score: number;
  matching_keywords: string[];
  missing_keywords: string[];
  raw_payload?: Record<string, unknown>;
};

type TopRecommendation = {
  job_title: string;
  reason: string;
};

type CandidateDetail = {
  id: string;
  title: string;
  parsed_name: string | null;
  email: string | null;
  created_at: string;
  stage: Stage;
  status: string;
  skills: string[];
  experience_summary: string[];
  file_type: string | null;
  file_available: boolean;
  source_filename: string | null;
  raw_text: string | null;
  matches: JobMatch[];
  top_recommendation: TopRecommendation | null;
  analysis_completed_at: string | null;
};

type Tab = "analysis" | "matches" | "preview" | "notes";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_OPTIONS: { value: Stage; label: string; cls: string }[] = [
  { value: "new", label: "Applied", cls: "text-sky-700 bg-sky-50 border-sky-200" },
  { value: "shortlisted", label: "Shortlisted ★", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { value: "interview", label: "Interview →", cls: "text-violet-700 bg-violet-50 border-violet-200" },
  { value: "rejected", label: "Rejected ✕", cls: "text-rose-600 bg-rose-50 border-rose-200" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function analysisFreshness(completedAt: string | null) {
  if (!completedAt) return null;
  const hours = (Date.now() - new Date(completedAt).getTime()) / 3_600_000;
  if (hours < 24) return { label: `Fresh · ${Math.round(hours)}h ago`, stale: false };
  const days = Math.floor(hours / 24);
  return { label: `${days} day${days !== 1 ? "s" : ""} ago`, stale: days > 7 };
}

function scoreColor(s: number) {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 40) return "bg-amber-400";
  return "bg-rose-400";
}

function scoreText(s: number) {
  if (s >= 70) return "text-emerald-700";
  if (s >= 40) return "text-amber-700";
  return "text-rose-600";
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Next Step logic ──────────────────────────────────────────────────────────

type NextStep = { message: string; action: string; variant: "primary" | "warning" | "neutral" };

function computeNextStep(detail: CandidateDetail, hasJobs: boolean): NextStep | null {
  if (detail.status !== "parsed") {
    return { message: "Resume is being processed. Analysis will run automatically.", action: "", variant: "neutral" };
  }
  if (detail.matches.length === 0 && !hasJobs) {
    return {
      message: "No jobs yet. Add at least one job, then run analysis to see match scores.",
      action: "Go to Jobs →",
      variant: "warning",
    };
  }
  if (detail.matches.length === 0 && hasJobs) {
    return {
      message: "Jobs exist but no analysis has been run for this candidate yet.",
      action: "Run Analysis",
      variant: "primary",
    };
  }
  const freshness = analysisFreshness(detail.analysis_completed_at);
  if (freshness?.stale) {
    return {
      message: "Analysis is over 7 days old and may be outdated. Consider refreshing.",
      action: "Refresh Analysis",
      variant: "warning",
    };
  }
  // 0% on all jobs = likely a language mismatch, not a bad candidate
  if (detail.matches.length > 0 && detail.matches.every((m) => m.overall_score === 0)) {
    return {
      message: "All match scores are 0%. The resume and job description may be in different languages. Use Deep AI Analysis for cross-language semantic matching.",
      action: "Deep AI Analysis",
      variant: "warning",
    };
  }

  if (detail.matches.every((m) => m.overall_score < 40)) {
    return {
      message: "All job match scores are below 40%. This candidate may not be a good fit.",
      action: "Reject",
      variant: "warning",
    };
  }
  if (detail.stage === "new" && detail.matches.some((m) => m.overall_score >= 70)) {
    return {
      message: "Strong match detected. Shortlist this candidate to keep them in the pipeline.",
      action: "Shortlist",
      variant: "primary",
    };
  }
  if (detail.stage === "shortlisted") {
    return {
      message: "Candidate is shortlisted. Next step: conduct an interview to complete evaluation.",
      action: "Move to Interview",
      variant: "primary",
    };
  }
  if (detail.stage === "interview") {
    return {
      message: "Interview stage — record your notes below and make a final decision.",
      action: "Add Notes",
      variant: "neutral",
    };
  }
  if (detail.stage === "rejected") {
    return null;
  }
  return {
    message: "Review the analysis and job matches, then make a hiring decision.",
    action: "Review Matches",
    variant: "neutral",
  };
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ value, label }: { value: number | null; label: string }) {
  const v = value ?? 0;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, v)) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg className="-rotate-90" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r={radius} stroke="#f1f5f9" strokeWidth="4" />
          <circle
            cx="28" cy="28" r={radius}
            stroke={value === null ? "#e2e8f0" : v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#f43f5e"}
            strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
          value === null ? "text-slate-300" : v >= 70 ? "text-emerald-700" : v >= 40 ? "text-amber-700" : "text-rose-600"
        }`}>
          {value === null ? "—" : `${v.toFixed(0)}%`}
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const c = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${scoreColor(c)}`} style={{ width: `${c}%` }} />
      </div>
      <span className={`w-12 text-right text-xs font-bold tabular-nums ${scoreText(c)}`}>
        {c.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Tab: AI Analysis ─────────────────────────────────────────────────────────

type GptPayload = {
  strengths?: string[];
  gaps?: string[];
  hiring_suggestion?: string;
  recommendation?: string;
};

function isGptPayload(payload: unknown): payload is GptPayload {
  return typeof payload === "object" && payload !== null && "hiring_suggestion" in payload;
}

function TabAnalysis({ detail }: { detail: CandidateDetail }) {
  const bestMatch = detail.matches[0] ?? null;
  const freshness = analysisFreshness(detail.analysis_completed_at);
  const gptData = bestMatch?.raw_payload && isGptPayload(bestMatch.raw_payload)
    ? bestMatch.raw_payload
    : null;

  if (!bestMatch) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">No analysis available</p>
        <p className="mt-2 text-xs text-slate-500">Add jobs and run matching to see analysis results here.</p>
      </div>
    );
  }

  const strengths = bestMatch.matching_keywords.slice(0, 6);
  const gaps = bestMatch.missing_keywords.slice(0, 6);

  return (
    <div className="space-y-5">
      {/* Freshness */}
      {freshness && (
        <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
          freshness.stale ? "border-amber-200 bg-amber-50" : "border-emerald-100 bg-emerald-50"
        }`}>
          <p className={`text-xs font-semibold ${freshness.stale ? "text-amber-700" : "text-emerald-700"}`}>
            {freshness.stale ? "⚠ Analysis may be outdated" : "✓ Analysis is current"}
          </p>
          <span className={`text-xs ${freshness.stale ? "text-amber-600" : "text-emerald-600"}`}>
            {freshness.label}
          </span>
        </div>
      )}

      {/* Top score */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Best Match</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{bestMatch.job_title}</p>
          </div>
          <span className={`text-2xl font-bold tabular-nums ${scoreText(bestMatch.overall_score)}`}>
            {bestMatch.overall_score.toFixed(1)}%
          </span>
        </div>
        <div className="mt-3">
          <ScoreBar score={bestMatch.overall_score} />
        </div>
      </div>

      {/* Strengths + Gaps side by side */}
      {/* GPT badge */}
      {gptData && (
        <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2">
          <span className="text-xs font-bold text-violet-600">✦ Deep AI Analysis</span>
          {gptData.hiring_suggestion && (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              gptData.hiring_suggestion === "shortlist" ? "bg-emerald-100 text-emerald-700" :
              gptData.hiring_suggestion === "interview" ? "bg-violet-100 text-violet-700" :
              gptData.hiring_suggestion === "reject" ? "bg-rose-100 text-rose-700" :
              "bg-slate-100 text-slate-600"
            }`}>
              {String(gptData.hiring_suggestion)}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">✦ Strengths</p>
          {/* GPT provides narrative strengths; TF-IDF provides keyword list */}
          {gptData?.strengths && gptData.strengths.length > 0 ? (
            <ul className="space-y-1.5">
              {gptData.strengths.map((s, i) => (
                <li key={i} className="text-xs leading-5 text-emerald-800">· {String(s)}</li>
              ))}
            </ul>
          ) : strengths.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {strengths.map((k) => (
                <span key={k} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {k}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-600">No strong matches found.</p>
          )}
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-amber-600">⚠ Gaps</p>
          {gptData?.gaps && gptData.gaps.length > 0 ? (
            <ul className="space-y-1.5">
              {gptData.gaps.map((g, i) => (
                <li key={i} className="text-xs leading-5 text-amber-800">· {String(g)}</li>
              ))}
            </ul>
          ) : gaps.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {gaps.map((k) => (
                <span key={k} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  {k}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-600">No significant gaps.</p>
          )}
        </div>
      </div>

      {/* Recommendation */}
      {detail.top_recommendation && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">AI Recommendation</p>
          <p className="text-sm leading-6 text-slate-700">{detail.top_recommendation.reason}</p>
        </div>
      )}

      {/* All skills */}
      {detail.skills.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">All Extracted Skills</p>
          <div className="flex flex-wrap gap-2">
            {detail.skills.map((skill) => {
              const isMatch = bestMatch.matching_keywords.map((k) => k.toLowerCase()).includes(skill.toLowerCase());
              const isGap = bestMatch.missing_keywords.map((k) => k.toLowerCase()).includes(skill.toLowerCase());
              return (
                <span
                  key={skill}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    isMatch ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                    isGap ? "border-amber-200 bg-amber-50 text-amber-700" :
                    "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  {skill}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Green = matched · Amber = gap · Gray = unclassified</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Job Matches ─────────────────────────────────────────────────────────

function TabMatches({ detail }: { detail: CandidateDetail }) {
  if (detail.matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">No job matches yet</p>
        <p className="mt-2 text-xs text-slate-500">
          Add jobs from the Jobs page, then re-upload this resume to generate matches.
        </p>
        <Link
          href="/recruiter/jobs"
          className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
        >
          Go to Jobs →
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {detail.matches.map((match) => (
        <li key={match.job_id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">{match.job_title}</p>
            <span className={`text-lg font-bold tabular-nums ${scoreText(match.overall_score)}`}>
              {match.overall_score.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <ScoreBar score={match.overall_score} />
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {match.matching_keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-emerald-600">Matched</p>
                <p className="text-xs text-slate-600">
                  {match.matching_keywords.slice(0, 6).join(", ")}
                  {match.matching_keywords.length > 6 && ` +${match.matching_keywords.length - 6}`}
                </p>
              </div>
            )}
            {match.missing_keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-amber-600">Missing</p>
                <p className="text-xs text-slate-600">
                  {match.missing_keywords.slice(0, 6).join(", ")}
                  {match.missing_keywords.length > 6 && ` +${match.missing_keywords.length - 6}`}
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Tab: Preview ─────────────────────────────────────────────────────────────

function TabPreview({ detail }: { detail: CandidateDetail }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.file_available) return;

    setLoadingFile(true);
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("jobai_access_token")
        : null;

    let objectUrl: string | null = null;

    fetch(`${getApiBaseUrl()}/recruiter/candidates/${detail.id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load file.");
        return r.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setFileError("Could not load the resume file."))
      .finally(() => setLoadingFile(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id, detail.file_available]);

  function handlePrint() {
    if (!blobUrl) return;
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      // Fallback: open in new tab for printing
      window.open(blobUrl, "_blank");
    }
  }

  function handleOpen() {
    if (blobUrl) window.open(blobUrl, "_blank");
  }

  // ── File not available — fall back to extracted text ─────────────────────
  if (!detail.file_available) {
    if (detail.raw_text) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-amber-600">⚠</span>
            <p className="text-xs text-amber-800">
              Original file is no longer on the server. Showing extracted text instead.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-slate-700">
              {detail.raw_text}
            </pre>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">Preview not available</p>
        <p className="mt-2 text-xs text-slate-500">
          The original file is no longer on the server and no extracted text was saved.
        </p>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingFile) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          Loading resume…
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (fileError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">{fileError}</p>
      </div>
    );
  }

  const isPdf = (detail.file_type || "").toLowerCase() === "pdf";

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
            isPdf ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
          }`}>
            {(detail.file_type || "FILE").toUpperCase()}
          </span>
          {detail.source_filename && (
            <span className="max-w-[200px] truncate text-xs text-slate-500">{detail.source_filename}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpen}
            disabled={!blobUrl}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
          >
            Open ↗
          </button>
          {isPdf && (
            <button
              type="button"
              onClick={handlePrint}
              disabled={!blobUrl}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
            >
              Print
            </button>
          )}
          {!isPdf && blobUrl && (
            <a
              href={blobUrl}
              download={detail.source_filename ?? `resume.${detail.file_type}`}
              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              Download
            </a>
          )}
        </div>
      </div>

      {/* Preview area */}
      {isPdf && blobUrl ? (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          title="Resume Preview"
          className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white"
        />
      ) : !isPdf && blobUrl ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">Word Document</p>
            <p className="mt-1 text-xs text-slate-500">
              In-browser preview is not supported for DOCX files. Use the Download button above.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Tab: Notes ───────────────────────────────────────────────────────────────

type Note = { id: string; text: string; date: string };

function TabNotes({ candidateId }: { candidateId: string }) {
  const storageKey = `jobai_notes_${candidateId}`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setNotes(JSON.parse(raw) as Note[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  function saveNotes(updated: Note[]) {
    setNotes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function addNote() {
    if (!draft.trim()) return;
    const note: Note = {
      id: Math.random().toString(36).slice(2),
      text: draft.trim(),
      date: new Date().toISOString(),
    };
    saveNotes([note, ...notes]);
    setDraft("");
  }

  function deleteNote(id: string) {
    saveNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note about this candidate…"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={addNote}
            disabled={!draft.trim()}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            Save Note
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-center text-xs text-slate-400">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-6 text-slate-800">{note.text}</p>
                <button
                  type="button"
                  onClick={() => deleteNote(note.id)}
                  className="flex-shrink-0 text-xs text-slate-300 transition hover:text-rose-400"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{fmtDate(note.date)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("analysis");
  const [stagePending, setStagePending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasJobs, setHasJobs] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [data, jobs] = await Promise.all([
          api.get<CandidateDetail>(`/recruiter/candidates/${id}`, { auth: true }),
          api.get<{ id: string }[]>("/recruiter/jobs/", { auth: true }),
        ]);
        setDetail(data);
        setHasJobs(jobs.length > 0);
      } catch {
        setError("Failed to load candidate profile.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  async function handleRunAnalysis(forceRefresh = false) {
    if (!detail || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await api.post<{
        analyses_created: number;
        has_resume_text: boolean;
        warning: string | null;
      }>(
        `/recruiter/candidates/${id}/analyze`,
        forceRefresh ? { force_refresh: true } : undefined,
        { auth: true }
      );

      if (!result.has_resume_text) {
        setAnalyzeError(result.warning ?? "No text found in resume.");
      } else if (result.warning) {
        setAnalyzeError(result.warning);
      }

      // Reload detail regardless — even 0% scores should show
      const data = await api.get<CandidateDetail>(`/recruiter/candidates/${id}`, { auth: true });
      setDetail(data);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleStageChange(stage: Stage) {
    if (!detail || stagePending) return;
    setStagePending(true);
    const prev = detail.stage;
    setDetail({ ...detail, stage }); // optimistic
    try {
      await api.patch(`/recruiter/candidates/${id}/stage`, { stage }, { auth: true });
    } catch {
      setDetail({ ...detail, stage: prev }); // revert
    } finally {
      setStagePending(false);
    }
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-100" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <Panel className="p-8">
        <p className="text-sm font-semibold text-rose-600">{error ?? "Not found."}</p>
        <Link href="/recruiter/candidates" className="mt-4 inline-block text-xs font-medium text-slate-500 underline">
          ← Back to Candidates
        </Link>
      </Panel>
    );
  }

  const nextStep = computeNextStep(detail, hasJobs);
  const topScore = detail.matches[0]?.overall_score ?? null;
  const stageOption = STAGE_OPTIONS.find((s) => s.value === detail.stage)!;
  const displayName = detail.parsed_name ?? detail.title;

  const TABS: { key: Tab; label: string }[] = [
    { key: "analysis", label: "AI Analysis" },
    { key: "matches", label: `Job Matches ${detail.matches.length > 0 ? `(${detail.matches.length})` : ""}` },
    { key: "preview", label: "Resume" },
    { key: "notes", label: "Notes" },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Back link ──────────────────────────────────────────── */}
      <Link
        href="/recruiter/candidates"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700"
      >
        ← Candidates
      </Link>

      {/* ── Sticky header card ─────────────────────────────────── */}
      <Panel className="sticky top-0 z-10 p-5 md:p-6">
        <div className="flex flex-wrap items-start gap-4">

          {/* Avatar + info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-sm font-bold text-white">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-slate-950">{displayName}</h1>
              {detail.parsed_name && detail.parsed_name !== detail.title && (
                <p className="text-xs text-slate-400">Resume file: {detail.title}</p>
              )}
              {detail.email && (
                <p className="text-xs text-slate-400">{detail.email}</p>
              )}
              <p className="mt-0.5 text-xs text-slate-400">Added {fmtDate(detail.created_at)}</p>
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center gap-4">
            <ScoreRing value={topScore} label="Match" />
          </div>

          {/* Stage selector */}
          <div className="flex-shrink-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Stage</p>
            <div className="relative">
              <select
                value={detail.stage}
                disabled={stagePending}
                onChange={(e) => void handleStageChange(e.target.value as Stage)}
                className={`appearance-none rounded-xl border px-3 py-2 pr-7 text-xs font-semibold outline-none transition cursor-pointer ${stageOption.cls}`}
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-60">▾</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Next Step panel ─────────────────────────────────────── */}
      {nextStep && (
        <div className={`rounded-2xl border px-5 py-4 ${
          nextStep.variant === "primary" ? "border-emerald-200 bg-emerald-50" :
          nextStep.variant === "warning" ? "border-amber-200 bg-amber-50" :
          "border-slate-200 bg-slate-50"
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 text-sm ${
                nextStep.variant === "primary" ? "text-emerald-600" :
                nextStep.variant === "warning" ? "text-amber-600" : "text-slate-400"
              }`}>
                {nextStep.variant === "primary" ? "→" : nextStep.variant === "warning" ? "⚠" : "·"}
              </span>
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${
                  nextStep.variant === "primary" ? "text-emerald-600" :
                  nextStep.variant === "warning" ? "text-amber-600" : "text-slate-400"
                }`}>
                  Next Step
                </p>
                <p className={`mt-0.5 text-sm leading-6 ${
                  nextStep.variant === "primary" ? "text-emerald-800" :
                  nextStep.variant === "warning" ? "text-amber-800" : "text-slate-600"
                }`}>
                  {nextStep.message}
                </p>
              </div>
            </div>

            {nextStep.action && (
              <>
                {nextStep.action === "Shortlist" && (
                  <button
                    type="button"
                    onClick={() => void handleStageChange("shortlisted")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Shortlist ★
                  </button>
                )}
                {nextStep.action === "Reject" && (
                  <button
                    type="button"
                    onClick={() => void handleStageChange("rejected")}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  >
                    Reject
                  </button>
                )}
                {nextStep.action === "Move to Interview" && (
                  <button
                    type="button"
                    onClick={() => void handleStageChange("interview")}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                  >
                    Move to Interview →
                  </button>
                )}
                {(nextStep.action === "Run Analysis" ||
                  nextStep.action === "Refresh Analysis" ||
                  nextStep.action === "Re-run Analysis" ||
                  nextStep.action === "Deep AI Analysis") && (
                  <button
                    type="button"
                    disabled={analyzing}
                    onClick={() =>
                      void handleRunAnalysis(
                        nextStep.action === "Refresh Analysis" || nextStep.action === "Deep AI Analysis"
                      )
                    }
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    {analyzing ? "Running…" : "✦ Analyze with AI"}
                  </button>
                )}
                {nextStep.action === "Go to Jobs →" && (
                  <Link
                    href="/recruiter/jobs"
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                  >
                    Go to Jobs →
                  </Link>
                )}
                {nextStep.action === "Add Notes" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("notes")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Add Notes
                  </button>
                )}
                {nextStep.action === "Review Matches" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("matches")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Review Matches
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Analyze error ──────────────────────────────────────── */}
      {analyzeError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          <span className="mr-1.5 font-bold">⚠</span>{analyzeError}
        </div>
      )}

      {/* ── Re-run AI Analysis button ────────────────────────── */}
      {detail.matches.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={analyzing}
            onClick={() => void handleRunAnalysis(true)}
            className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-40"
          >
            {analyzing ? "Running…" : "✦ Re-run AI Analysis"}
          </button>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
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

      {/* ── Tab content ─────────────────────────────────────────── */}
      <div className="pb-8">
        {activeTab === "analysis" && <TabAnalysis detail={detail} />}
        {activeTab === "matches" && <TabMatches detail={detail} />}
        {activeTab === "preview" && <TabPreview detail={detail} />}
        {activeTab === "notes" && <TabNotes candidateId={id} />}
      </div>

    </div>
  );
}
