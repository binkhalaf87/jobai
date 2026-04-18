"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Panel } from "@/components/panel";
import { RewriteSuggestionCard } from "@/components/rewrite-suggestion-card";
import { runFullAnalysis } from "@/lib/analysis";
import type {
  AnalysisFullResponse,
  AnalysisIssue,
  AnalysisScoreBreakdownItem
} from "@/types";

type LoadState = "idle" | "loading" | "success" | "error";

const BREAKDOWN_LABELS = {
  match: "Match Score",
  ats: "ATS Score",
  content: "Content Score",
  completeness: "Completeness Score"
} as const;

const KEYWORD_GROUP_LABELS = {
  hard_skills: "Hard skills",
  soft_skills: "Soft skills",
  job_titles: "Job titles",
  tools: "Tools",
  years_of_experience: "Experience signals",
  role_keywords: "Role keywords"
} as const;

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatWeight(value: number): string {
  return `${Math.round(value * 100)}% weight`;
}

function getSeverityClasses(severity: string): string {
  if (severity === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function BreakdownCard({
  label,
  item
}: {
  label: string;
  item: AnalysisScoreBreakdownItem;
}) {
  return (
    <Panel className="p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-semibold tracking-tight text-slate-950">{formatPercent(item.score)}</p>
          <p className="mt-1 text-sm text-slate-500">{formatWeight(item.weight)}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Contribution</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{item.weighted_score.toFixed(2)}</p>
        </div>
      </div>
    </Panel>
  );
}

function KeywordList({
  title,
  items,
  tone = "slate"
}: {
  title: string;
  items: string[];
  tone?: "slate" | "emerald" | "amber";
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-teal-light bg-teal-light/30 text-teal"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <Panel className="p-6">
      <h3 className="text-lg font-semibold tracking-tight text-slate-950">{title}</h3>
      {items.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${title}-${item}`}
              className={`rounded-full border px-3 py-2 text-sm font-medium ${toneClasses}`}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-500">No items surfaced in this section yet.</p>
      )}
    </Panel>
  );
}

function IssueCard({ issue }: { issue: AnalysisIssue }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold capitalize text-slate-900">
          {issue.category.replaceAll("_", " ")}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getSeverityClasses(issue.severity)}`}>
          {issue.severity}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{issue.message}</p>
    </div>
  );
}

// This client shell loads the combined analysis result from the authenticated API and renders the full report.
export function AnalysisResultsShell() {
  const searchParams = useSearchParams();
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [analysis, setAnalysis] = useState<AnalysisFullResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const resumeId = searchParams.get("resumeId") ?? "";
  const jobDescriptionId = searchParams.get("jobDescriptionId") ?? "";
  const hasValidParams = Boolean(resumeId && jobDescriptionId);

  const groupedKeywords = useMemo(() => {
    const keywordData = analysis?.result.job_description_keywords ?? {};
    return Object.entries(KEYWORD_GROUP_LABELS)
      .map(([key, label]) => ({
        key,
        label,
        values: keywordData[key as keyof typeof keywordData] ?? []
      }))
      .filter((group) => group.values.length > 0);
  }, [analysis]);

  const topIssues = useMemo(() => analysis?.result.ats.issues.slice(0, 4) ?? [], [analysis]);

  useEffect(() => {
    if (!hasValidParams) {
      return;
    }

    let isCancelled = false;

    async function loadAnalysis() {
      setLoadState("loading");
      setErrorMessage("");
      setAnalysis(null);

      try {
        const response = await runFullAnalysis({
          resume_id: resumeId,
          job_description_id: jobDescriptionId
        });

        if (!isCancelled) {
          setAnalysis(response);
          setLoadState("success");
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load the analysis.");
          setLoadState("error");
        }
      }
    }

    void loadAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [hasValidParams, jobDescriptionId, resumeId]);

  if (!hasValidParams) {
    return (
      <div className="space-y-6">
        <Panel className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Analysis Results</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Pick a CV and job first</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            This screen expects both a `resumeId` and `jobDescriptionId` in the URL so it can run the full analysis flow
            and render the saved result set.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-2xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Back to dashboard
          </Link>
        </Panel>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="space-y-6">
        <Panel className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-500">Analysis Error</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">We couldn&apos;t generate this result yet</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            {errorMessage || "Check the saved CV and job, then try again."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Retry analysis
            </button>
          </div>
        </Panel>
      </div>
    );
  }

  if (loadState === "loading" || !analysis) {
    return (
      <div className="space-y-6">
        <Panel className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Analysis Results</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Running your CV check</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Scoring fit, ATS readiness, and key gaps.
          </p>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-800" />
          </div>
        </Panel>
      </div>
    );
  }

  const breakdown = analysis.result.score.detailed_score_breakdown;
  const suggestions = analysis.result.ats.suggestions;

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden p-8 md:p-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Analysis Results</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Your fit and ATS summary
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">{analysis.result.score.explanation}</p>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-xl">
            <div className="rounded-[2rem] bg-brand-900 px-6 py-5 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Overall Score</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight">{formatPercent(analysis.result.score.overall_score)}</p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Match Score</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {formatPercent(analysis.result.match.match_score)}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">ATS Score</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {formatPercent(analysis.result.ats.ats_score)}
              </p>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <Panel className="p-6 md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Score Breakdown</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">How scoring works</h2>
              </div>
              <p className="text-sm text-slate-500">Four clear scoring areas.</p>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <BreakdownCard label={BREAKDOWN_LABELS.match} item={breakdown.match} />
              <BreakdownCard label={BREAKDOWN_LABELS.ats} item={breakdown.ats} />
              <BreakdownCard label={BREAKDOWN_LABELS.content} item={breakdown.content} />
              <BreakdownCard label={BREAKDOWN_LABELS.completeness} item={breakdown.completeness} />
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <KeywordList title="Found Keywords" items={analysis.result.match.matching_keywords} tone="emerald" />
            <KeywordList title="Missing Keywords" items={analysis.result.match.missing_keywords} tone="amber" />
          </div>

          <Panel className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Job Signals</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Role keywords</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {groupedKeywords.length ? (
                groupedKeywords.map((group) => (
                  <div key={group.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-base font-semibold text-slate-950">{group.label}</h3>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.values.map((value) => (
                        <span
                          key={`${group.key}-${value}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500 md:col-span-2">
                  No extracted role keyword groups were returned for this job description.
                </div>
              )}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Top Issues</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Top ATS risks</h2>
            <div className="mt-6 space-y-4">
              {topIssues.length ? (
                topIssues.map((issue) => <IssueCard key={`${issue.category}-${issue.message}`} issue={issue} />)
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                  No ATS issues were surfaced in the current result set.
                </div>
              )}
            </div>
          </Panel>

          <Panel className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Improvement Suggestions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Next actions</h2>
            <div className="mt-6 space-y-3">
              {suggestions.length ? (
                suggestions.map((suggestion, index) => (
                  <div key={suggestion} className="flex gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{suggestion}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                  No improvement suggestions were returned for this analysis.
                </div>
              )}
            </div>
          </Panel>

          <Panel className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Analysis Context</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Saved IDs</h2>
            <dl className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Analysis ID</dt>
                <dd className="mt-2 break-all font-mono text-sm text-slate-900">{analysis.analysis_id}</dd>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Resume ID</dt>
                <dd className="mt-2 break-all font-mono text-sm text-slate-900">{analysis.resume_id}</dd>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Job Description ID</dt>
                <dd className="mt-2 break-all font-mono text-sm text-slate-900">{analysis.job_description_id}</dd>
              </div>
            </dl>
          </Panel>
        </div>
      </div>

      <RewriteSuggestionCard
        analysisId={analysis.analysis_id}
        missingKeywords={analysis.result.match.missing_keywords}
      />
    </div>
  );
}
