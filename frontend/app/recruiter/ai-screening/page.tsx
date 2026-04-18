"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Sparkles, UserCircle, Briefcase, ArrowRight } from "lucide-react";

import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "new" | "shortlisted" | "interview" | "rejected";

type CandidateListItem = {
  id: string;
  title: string;
  parsed_name: string | null;
  email: string | null;
  stage: Stage;
  best_match_job: string | null;
  best_match_score: number | null;
  analysis_completed_at: string | null;
};

type TopRecommendation = {
  job_title: string;
  reason: string;
};

type CandidateDetail = {
  id: string;
  parsed_name: string | null;
  title: string;
  email: string | null;
  stage: Stage;
  skills: string[];
  experience_summary: string[];
  top_recommendation: TopRecommendation | null;
  analysis_completed_at: string | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<Stage, string> = {
  new:         "bg-sky-100 text-sky-700",
  shortlisted: "bg-emerald-100 text-emerald-700",
  interview:   "bg-violet-100 text-violet-700",
  rejected:    "bg-rose-100 text-rose-500",
};

const STAGE_LABELS: Record<Stage, string> = {
  new: "Applied", shortlisted: "Shortlisted", interview: "Interview", rejected: "Rejected",
};

const VERDICT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  shortlist:    { label: "Shortlist",    color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "✅" },
  interview:    { label: "Interview",    color: "bg-violet-100 text-violet-700 border-violet-200",   icon: "🎯" },
  needs_review: { label: "Needs Review", color: "bg-amber-100 text-amber-700 border-amber-200",     icon: "🔍" },
  reject:       { label: "Reject",       color: "bg-rose-100 text-rose-600 border-rose-200",         icon: "✗"  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

// ─── Candidate snapshot ───────────────────────────────────────────────────────

function CandidateSnapshot({
  listItem,
  detail,
  loading,
  onAnalyze,
  analyzing,
  onStageChange,
  stagePending,
}: {
  listItem: CandidateListItem;
  detail: CandidateDetail | null;
  loading: boolean;
  onAnalyze: () => void;
  analyzing: boolean;
  onStageChange: (stage: Stage) => void;
  stagePending: boolean;
}) {
  const name = listItem.parsed_name ?? listItem.title;
  const hasAnalysis = !!listItem.analysis_completed_at;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="h-4 w-32 rounded bg-slate-100" />
        <div className="h-3 w-48 rounded bg-slate-100" />
        <div className="h-20 rounded bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">

      {/* ── Identity ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${
            listItem.stage === "shortlisted" ? "bg-emerald-500" :
            listItem.stage === "interview"   ? "bg-violet-500"  :
            listItem.stage === "rejected"    ? "bg-slate-300"   : "bg-slate-600"
          }`}>
            {initials(name)}
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">{name}</p>
            {listItem.email && <p className="text-xs text-slate-400">{listItem.email}</p>}
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STAGE_COLORS[listItem.stage]}`}>
          {STAGE_LABELS[listItem.stage]}
        </span>
      </div>

      {/* ── Skills ── */}
      {detail && detail.skills.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Extracted Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {detail.skills.slice(0, 8).map((s) => (
              <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{s}</span>
            ))}
            {detail.skills.length > 8 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">+{detail.skills.length - 8}</span>
            )}
          </div>
        </div>
      )}

      {/* ── Experience ── */}
      {detail && detail.experience_summary.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Experience</p>
          <ul className="space-y-1">
            {detail.experience_summary.slice(0, 3).map((exp, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-300" />
                {exp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── GPT Assessment ── */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <Sparkles size={12} className="text-violet-500" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">AI Assessment</p>
        </div>

        {!hasAnalysis ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-slate-500">No analysis yet.</p>
            <button
              type="button"
              onClick={onAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              <Sparkles size={11} />
              {analyzing ? "Running…" : "Run AI Analysis"}
            </button>
          </div>
        ) : detail?.top_recommendation ? (
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed text-slate-700">
              &ldquo;{detail.top_recommendation.reason}&rdquo;
            </p>
            {detail.top_recommendation.job_title && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Briefcase size={11} />
                Best for: <span className="font-semibold text-slate-700">{detail.top_recommendation.job_title}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] text-slate-500">Analysis done but no recommendation generated.</p>
            <button
              type="button"
              onClick={onAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1.5 rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
            >
              {analyzing ? "Running…" : "Re-run"}
            </button>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        {listItem.stage !== "shortlisted" && (
          <button type="button" disabled={stagePending}
            onClick={() => onStageChange("shortlisted")}
            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-40">
            Shortlist
          </button>
        )}
        {listItem.stage !== "interview" && (
          <button type="button" disabled={stagePending}
            onClick={() => onStageChange("interview")}
            className="rounded-lg border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-40">
            Move to Interview
          </button>
        )}
        {listItem.stage !== "rejected" && (
          <button type="button" disabled={stagePending}
            onClick={() => onStageChange("rejected")}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40">
            Reject
          </button>
        )}
        <Link
          href={`/recruiter/candidates/${listItem.id}`}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-500 transition hover:text-brand-700"
        >
          Full profile <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AIScreeningPage() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, CandidateDetail>>({});
  const [detailLoading, setDetailLoading] = useState(false);

  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [stagePendingId, setStagePendingId] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const TAB_LIMIT = 5;

  // Load candidate list
  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<CandidateListItem[]>("/recruiter/candidates/", { auth: true });
        setCandidates(data);
        if (data.length > 0) setSelectedId(data[0].id);
      } catch {
        // silently fail
      } finally {
        setListLoading(false);
      }
    }
    void load();
  }, []);

  // Load detail on selection
  useEffect(() => {
    if (!selectedId || details[selectedId]) return;
    setDetailLoading(true);
    api.get<CandidateDetail>(`/recruiter/candidates/${selectedId}`, { auth: true })
      .then((d) => setDetails((prev) => ({ ...prev, [selectedId]: d })))
      .catch(() => {/* leave null */})
      .finally(() => setDetailLoading(false));
  }, [selectedId, details]);

  async function handleAnalyze(id: string) {
    setAnalyzingId(id);
    try {
      await api.post(`/recruiter/candidates/${id}/analyze`, undefined, { auth: true });
      // Refresh detail
      setDetails((prev) => { const next = { ...prev }; delete next[id]; return next; });
      setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, analysis_completed_at: new Date().toISOString() } : c));
    } catch {/* ignore */} finally {
      setAnalyzingId(null);
    }
  }

  async function handleStageChange(id: string, stage: Stage) {
    setStagePendingId(id);
    try {
      await api.patch(`/recruiter/candidates/${id}/stage`, { stage }, { auth: true });
      setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, stage } : c));
    } catch {/* ignore */} finally {
      setStagePendingId(null);
    }
  }

  if (listLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <UserCircle size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="text-sm font-semibold text-slate-700">No candidates to screen</p>
        <p className="mt-1 text-xs text-slate-400">Upload resumes from the Candidates page first.</p>
        <Link href="/recruiter/candidates"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700">
          Go to Candidates <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  const visibleTabs = candidates.slice(0, TAB_LIMIT);
  const moreTabs = candidates.slice(TAB_LIMIT);
  const selectedCandidate = candidates.find((c) => c.id === selectedId) ?? candidates[0];

  return (
    <div className="space-y-4">

      {/* ── Tabs ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {visibleTabs.map((c) => {
          const name = c.parsed_name ?? c.title;
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={[
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-semibold transition",
                active
                  ? "bg-brand-800 text-white shadow-sm shadow-brand-800/20"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900",
              ].join(" ")}
            >
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[9px] font-bold ${
                active ? "bg-white/20 text-white" :
                c.stage === "shortlisted" ? "bg-emerald-100 text-emerald-700" :
                c.stage === "interview"   ? "bg-violet-100 text-violet-700"   : "bg-slate-100 text-slate-600"
              }`}>
                {(c.parsed_name ?? c.title).slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[100px] truncate">{name.split(" ")[0]}</span>
            </button>
          );
        })}

        {/* More dropdown */}
        {moreTabs.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-600 transition hover:border-slate-300"
            >
              +{moreTabs.length} more <ChevronDown size={12} />
            </button>
            {showMore && (
              <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="p-1.5">
                  {moreTabs.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedId(c.id); setShowMore(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${STAGE_COLORS[c.stage]}`}>
                        {STAGE_LABELS[c.stage][0]}
                      </span>
                      <span className="truncate">{c.parsed_name ?? c.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Snapshot ── */}
      {selectedCandidate && (
        <CandidateSnapshot
          listItem={selectedCandidate}
          detail={details[selectedCandidate.id] ?? null}
          loading={detailLoading && !details[selectedCandidate.id]}
          onAnalyze={() => void handleAnalyze(selectedCandidate.id)}
          analyzing={analyzingId === selectedCandidate.id}
          onStageChange={(stage) => void handleStageChange(selectedCandidate.id, stage)}
          stagePending={stagePendingId === selectedCandidate.id}
        />
      )}
    </div>
  );
}
