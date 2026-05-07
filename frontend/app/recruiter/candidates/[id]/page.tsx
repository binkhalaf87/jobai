"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import { Panel } from "@/components/panel";
import { CandidateHeader } from "@/components/candidate/CandidateHeader";
import { CandidateAnalysisPanel } from "@/components/candidate/CandidateAnalysisPanel";
import { CandidateMatchesPanel } from "@/components/candidate/CandidateMatchesPanel";
import { CandidateDocuments } from "@/components/candidate/CandidateDocuments";
import { CandidateInterviewPanel } from "@/components/candidate/CandidateInterviewPanel";
import { CandidateNotes } from "@/components/candidate/CandidateNotes";
import { computeNextStep } from "@/components/candidate/utils";
import type { CandidateDetail, ScreeningReport, Stage, Tab } from "@/components/candidate/types";

export default function CandidateProfilePage() {
  const t = useTranslations("recruiter.candidateDetailPage");
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("screening");
  const [stagePending, setStagePending] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [hasJobs, setHasJobs] = useState(false);
  const [screening, setScreening] = useState<ScreeningReport | null>(null);
  const [screeningTimedOut, setScreeningTimedOut] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const [data, jobs, screen] = await Promise.all([
          api.get<CandidateDetail>(`/recruiter/candidates/${id}`),
          api.get<{ id: string }[]>("/recruiter/jobs/"),
          api.get<ScreeningReport | null>(`/recruiter/candidates/${id}/screening`).catch(() => null),
        ]);
        setDetail(data);
        setHasJobs(jobs.length > 0);
        setScreening(screen);
        if (!screen || screen.status === "pending") schedulePoll();
      } catch {
        setError(t("error.failedToLoad"));
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function schedulePoll() {
    if (pollCountRef.current >= 20) {
      setScreeningTimedOut(true);
      return;
    }
    pollCountRef.current += 1;
    pollRef.current = setTimeout(async () => {
      try {
        const screen = await api.get<ScreeningReport | null>(`/recruiter/candidates/${id}/screening`);
        setScreening(screen);
        if (!screen || screen.status === "pending") schedulePoll();
      } catch { /* ignore */ }
    }, 4000);
  }

  async function handleRegenerate() {
    if (regenerating) return;
    setRegenerating(true);
    pollCountRef.current = 0;
    setScreeningTimedOut(false);
    try {
      const screen = await api.post<ScreeningReport>(`/recruiter/candidates/${id}/screening`, undefined);
      setScreening(screen);
      schedulePoll();
    } catch { /* ignore */ } finally {
      setRegenerating(false);
    }
  }

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
      );

      if (!result.has_resume_text) {
        setAnalyzeError(result.warning ?? "No text found in resume.");
      } else if (result.warning) {
        setAnalyzeError(result.warning);
      }

      const data = await api.get<CandidateDetail>(`/recruiter/candidates/${id}`);
      setDetail(data);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : t("error.analysisFailed"));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleStageChange(stage: Stage) {
    if (!detail || stagePending) return;
    setStagePending(true);
    const prev = detail.stage;
    setDetail({ ...detail, stage });
    try {
      await api.patch(`/recruiter/candidates/${id}/stage`, { stage });
    } catch {
      setDetail({ ...detail, stage: prev });
    } finally {
      setStagePending(false);
    }
  }

  // ─── Loading ─────────────────────────────────────────────────────────────────

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
        <p className="text-sm font-semibold text-rose-600">{error ?? t("error.notFound")}</p>
        <Link href="/recruiter/candidates" className="mt-4 inline-block text-xs font-medium text-slate-500 underline">
          {t("error.backToCandidates")}
        </Link>
      </Panel>
    );
  }

  const nextStep = computeNextStep(detail, hasJobs);
  const topScore = detail.matches[0]?.overall_score ?? null;

  const TABS: { key: Tab; label: string }[] = [
    { key: "screening",  label: t("tabs.screening") },
    { key: "matches",    label: detail.matches.length > 0 ? t("tabs.jobMatchesWithCount", { count: detail.matches.length }) : t("tabs.jobMatches") },
    { key: "interview",  label: t("tabs.interview") },
    { key: "preview",    label: t("tabs.resume") },
    { key: "notes",      label: t("tabs.notes") },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      <Link href="/recruiter/candidates"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-700">
        {t("backToCandidates")}
      </Link>

      <Panel className="sticky top-0 z-10 p-5 md:p-6">
        <CandidateHeader
          detail={detail}
          topScore={topScore}
          stagePending={stagePending}
          onStageChange={(stage) => void handleStageChange(stage)}
        />
      </Panel>

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
                }`}>{t("nextStep")}</p>
                <p className={`mt-0.5 text-sm leading-6 ${
                  nextStep.variant === "primary" ? "text-emerald-800" :
                  nextStep.variant === "warning" ? "text-amber-800" : "text-slate-600"
                }`}>{t(nextStep.messageKey)}</p>
              </div>
            </div>

            {nextStep.action && (
              <>
                {nextStep.action === "Shortlist" && (
                  <button type="button" onClick={() => void handleStageChange("shortlisted")}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">
                    {t("actions.shortlist")}
                  </button>
                )}
                {nextStep.action === "Reject" && (
                  <button type="button" onClick={() => void handleStageChange("rejected")}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700">
                    {t("actions.reject")}
                  </button>
                )}
                {nextStep.action === "Move to Interview" && (
                  <button type="button" onClick={() => void handleStageChange("interview")}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700">
                    {t("actions.moveToInterview")}
                  </button>
                )}
                {(nextStep.action === "Run Analysis" ||
                  nextStep.action === "Refresh Analysis" ||
                  nextStep.action === "Re-run Analysis" ||
                  nextStep.action === "Deep AI Analysis") && (
                  <button type="button" disabled={analyzing}
                    onClick={() => void handleRunAnalysis(
                      nextStep.action === "Refresh Analysis" || nextStep.action === "Deep AI Analysis"
                    )}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">
                    {analyzing ? t("actions.running") : t("actions.analyzeWithAi")}
                  </button>
                )}
                {nextStep.action === "Go to Jobs →" && (
                  <Link href="/recruiter/jobs"
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700">
                    {t("actions.goToJobs")}
                  </Link>
                )}
                {nextStep.action === "Add Notes" && (
                  <button type="button" onClick={() => setActiveTab("notes")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                    {t("actions.addNotes")}
                  </button>
                )}
                {nextStep.action === "Review Matches" && (
                  <button type="button" onClick={() => setActiveTab("matches")}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100">
                    {t("actions.reviewMatches")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {analyzeError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
          <span className="mr-1.5 font-bold">⚠</span>{analyzeError}
        </div>
      )}

      {detail.matches.length > 0 && (
        <div className="flex justify-end">
          <button type="button" disabled={analyzing} onClick={() => void handleRunAnalysis(true)}
            className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-40">
            {analyzing ? t("actions.running") : t("actions.reRunAnalysis")}
          </button>
        </div>
      )}

      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs font-semibold transition border-b-2 ${
                activeTab === tab.key
                  ? "border-brand-800 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="pb-8">
        {activeTab === "screening" && (
          <CandidateAnalysisPanel
            report={screening}
            detail={detail}
            onRegenerate={() => void handleRegenerate()}
            regenerating={regenerating}
            timedOut={screeningTimedOut}
          />
        )}
        {activeTab === "matches"   && <CandidateMatchesPanel detail={detail} />}
        {activeTab === "interview" && <CandidateInterviewPanel candidateId={id} />}
        {activeTab === "preview"   && <CandidateDocuments detail={detail} />}
        {activeTab === "notes"     && <CandidateNotes candidateId={id} />}
      </div>

    </div>
  );
}
