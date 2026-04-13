"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/panel";
import { loadDashboardOverview, type DashboardActivityItem, type DashboardOverviewData } from "@/lib/dashboard";
import { atsLabel, interviewReadinessLabel } from "@/lib/product-insights";

type JourneyStep = {
  num: number;
  label: string;
  href: string;
  done: boolean;
  active: boolean;
};

type MetricCardProps = {
  label: string;
  value: string;
  note: string;
};

type QuickAction = {
  label: string;
  href: string;
  description: string;
};

const ACTIVITY_STYLES: Record<DashboardActivityItem["kind"], string> = {
  resume: "bg-sky-50 text-sky-700 border-sky-200",
  "saved-job": "bg-amber-50 text-amber-700 border-amber-200",
  "analysis-report": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "enhancement-report": "bg-violet-50 text-violet-700 border-violet-200",
  interview: "bg-rose-50 text-rose-700 border-rose-200",
  campaign: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCount(count: number | null, suffix = ""): string {
  if (count === null) return "-";
  return `${count.toLocaleString()}${suffix}`;
}

function formatPercentage(value: number | null): string {
  if (value === null) return "-";
  return `${Math.round(value)}%`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function JourneyProgress({ overview }: { overview: DashboardOverviewData }) {
  const steps: JourneyStep[] = [
    {
      num: 1,
      label: "Upload CV",
      href: "/dashboard/resumes",
      done: (overview.resumes.data?.length ?? 0) > 0,
      active: false,
    },
    {
      num: 2,
      label: "Analyze CV",
      href: "/dashboard/analysis",
      done: (overview.analysisReports.data?.filter((report) => report.status === "completed").length ?? 0) > 0,
      active: false,
    },
    {
      num: 3,
      label: "Improve CV",
      href: "/dashboard/enhancement",
      done: (overview.enhancementReports.data?.filter((report) => report.status === "completed").length ?? 0) > 0,
      active: false,
    },
    {
      num: 4,
      label: "Match Jobs",
      href: "/dashboard/job-search",
      done: (overview.metrics.jobsMatched ?? 0) > 0,
      active: false,
    },
    {
      num: 5,
      label: "Send Campaign",
      href: "/dashboard/smart-send",
      done: (overview.metrics.applicationsSent ?? 0) > 0,
      active: false,
    },
    {
      num: 6,
      label: "Practice Interview",
      href: "/dashboard/ai-interview",
      done: (overview.interviews.data?.filter((item) => item.status === "completed").length ?? 0) > 0,
      active: false,
    },
  ];

  const firstIncompleteIndex = steps.findIndex((step) => !step.done);
  if (firstIncompleteIndex >= 0) {
    steps[firstIncompleteIndex].active = true;
  }

  const completedCount = steps.filter((step) => step.done).length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Journey</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {completedCount === steps.length
              ? "All major steps have activity."
              : `${completedCount} of ${steps.length} steps completed`}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {steps.map((step) => (
            <div
              key={step.num}
              className={`h-1.5 w-7 rounded-full ${
                step.done ? "bg-emerald-500" : step.active ? "bg-slate-900" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {steps.map((step) => (
          <Link
            key={step.num}
            href={step.href}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition ${
              step.done
                ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                : step.active
                  ? "border-slate-300 bg-slate-100 hover:bg-white"
                  : "border-slate-200 bg-slate-50 hover:bg-white"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                step.done
                  ? "bg-emerald-500 text-white"
                  : step.active
                    ? "bg-slate-900 text-white"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {step.done ? "OK" : step.num}
            </span>
            <p
              className={`text-[10px] font-semibold leading-tight ${
                step.done ? "text-emerald-700" : step.active ? "text-slate-900" : "text-slate-500"
              }`}
            >
              {step.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardMetricCard({ label, value, note }: MetricCardProps) {
  return (
    <Panel className="p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{note}</p>
    </Panel>
  );
}

function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-40 rounded bg-slate-200" />
          <div className="h-10 w-72 rounded bg-slate-200" />
          <div className="h-4 w-full max-w-3xl rounded bg-slate-100" />
          <div className="h-4 w-full max-w-2xl rounded bg-slate-100" />
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Panel key={index} className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-8 w-16 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-3/4 rounded bg-slate-100" />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {Array.from({ length: 2 }, (_, index) => (
          <Panel key={index} className="p-6 md:p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-28 rounded bg-slate-200" />
              <div className="h-8 w-64 rounded bg-slate-200" />
              <div className="h-20 rounded bg-slate-100" />
              <div className="h-20 rounded bg-slate-100" />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function buildQuickActions(overview: DashboardOverviewData): QuickAction[] {
  const resumes = overview.resumes.data;
  const savedJobs = overview.savedJobs.data;
  const analysisReports = overview.analysisReports.data;
  const interviews = overview.interviews.data;

  const parsedResumes = resumes?.filter((resume) => resume.processing_status === "parsed").length ?? 0;
  const completedAnalysisReports = analysisReports?.filter((report) => report.status === "completed").length ?? 0;
  const completedInterviews = interviews?.filter((interview) => interview.status === "completed").length ?? 0;

  return [
    {
      label: "Analyze CV",
      href: "/dashboard/analysis",
      description:
        resumes == null
          ? "Resume data is unavailable right now."
          : parsedResumes > 0
            ? `${pluralize(parsedResumes, "resume")} ready for analysis.`
            : "Upload and parse a resume to unlock your first ATS report.",
    },
    {
      label: "Match Jobs",
      href: "/dashboard/job-search",
      description:
        savedJobs == null
          ? "Saved job data is unavailable right now."
          : savedJobs.length > 0
            ? `${pluralize(savedJobs.length, "saved job")} ready to revisit and prioritize.`
            : "Search live roles and score them against your resume.",
    },
    {
      label: "Practice Interview",
      href: "/dashboard/ai-interview",
      description:
        interviews == null
          ? "Interview history is unavailable right now."
          : completedInterviews > 0
            ? `${pluralize(completedInterviews, "completed interview")} already contributing to readiness.`
            : completedAnalysisReports > 0
              ? "Use your latest analysis context to rehearse before you apply."
              : "Build analysis first, then practice with stronger role context.",
    },
  ];
}

export function DashboardOverview() {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      setIsLoading(true);
      const nextOverview = await loadDashboardOverview();

      if (!cancelled) {
        setOverview(nextOverview);
        setIsLoading(false);
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  if (isLoading || !overview) {
    return <DashboardLoadingState />;
  }

  const failedCollections = [
    overview.resumes,
    overview.savedJobs,
    overview.analysisReports,
    overview.enhancementReports,
    overview.interviews,
    overview.campaigns,
  ].filter((collection) => collection.error);

  if (failedCollections.length === 6) {
    return (
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Career Command Center</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Live workspace data could not be loaded
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          The dashboard only uses real account data. Every connected source failed to respond, so nothing is being
          approximated.
        </p>
        <button
          type="button"
          onClick={() => setRefreshIndex((value) => value + 1)}
          className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Retry loading dashboard
        </button>
      </Panel>
    );
  }

  const latestActivity = overview.recentActivity[0] ?? null;
  const parsedResumeCount = overview.resumes.data?.filter((resume) => resume.processing_status === "parsed").length ?? null;
  const quickActions = buildQuickActions(overview);
  const latestAnalysisDate = overview.latestAnalysisReport?.completed_at ?? overview.latestAnalysisReport?.created_at ?? null;
  const campaignCount = overview.campaigns.data?.length ?? null;
  const savedJobCount = overview.savedJobs.data?.length ?? null;
  const focusLabel =
    overview.metrics.completedJourneySteps >= 5
      ? "Keep momentum high"
      : overview.metrics.completedJourneySteps >= 3
        ? "Convert readiness into action"
        : "Build your foundation";
  const focusDescription =
    overview.metrics.completedJourneySteps >= 5
      ? "You already have traction. Focus on sending, practicing, and doubling down on strong opportunities."
      : overview.metrics.completedJourneySteps >= 3
        ? "Your core assets are in place. Now move faster on matching, outreach, and interview practice."
        : "Start with one strong resume, one clear ATS analysis, and one improved version before scaling out.";

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <div className="border-b border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_55%,#ecfeff_100%)] px-8 py-8 md:px-10 md:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Career Command Center</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                Move from CV quality to interview confidence
              </h1>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                {overview.metrics.activeResumeTitle
                  ? `Your active resume is ${overview.metrics.activeResumeTitle}. Work through the journey below to improve fit, send outreach, and practice before recruiter conversations begin.`
                  : "This overview only uses live workspace data. Missing sources are shown as unavailable instead of placeholders."}
              </p>
              {latestActivity && (
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  Latest activity: <span className="font-semibold text-slate-800">{latestActivity.title}</span> on{" "}
                  {formatDateTime(latestActivity.createdAt)}.
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Current focus</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{focusLabel}</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">{focusDescription}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Journey health</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{overview.metrics.completedJourneySteps}/6 steps active</p>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {savedJobCount ?? 0} saved roles and {campaignCount ?? 0} campaign{campaignCount === 1 ? "" : "s"} currently shape your momentum.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-8 py-5 md:grid-cols-3 md:px-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Active Resume</p>
            <p className="mt-2 text-base font-semibold text-slate-950">{overview.metrics.activeResumeTitle ?? "No active resume yet"}</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              {overview.metrics.activeResumeTitle
                ? "Use this as the default reference for matching, outreach, and interview prep."
                : "Upload and parse a resume to unlock the full guided journey."}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Best next action</p>
            <p className="mt-2 text-base font-semibold text-slate-950">{overview.nextStep.label}</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">{overview.nextStep.description}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Decision rule</p>
            <p className="mt-2 text-base font-semibold text-slate-950">
              {(overview.metrics.atsScore ?? 0) >= 75 ? "Push strongest matches forward" : "Improve the CV before scaling out"}
            </p>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Strong ATS quality helps every downstream step perform better, especially matching and SmartSend.
            </p>
          </div>
        </div>
      </Panel>

      {failedCollections.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          Some dashboard sections are temporarily unavailable:{" "}
          {failedCollections.map((collection) => collection.label).join(", ")}.
        </div>
      )}

      <JourneyProgress overview={overview} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          label="ATS Score"
          value={formatPercentage(overview.metrics.atsScore)}
          note={
            latestAnalysisDate
              ? `${atsLabel(overview.metrics.atsScore)} based on your latest completed analysis from ${formatDate(latestAnalysisDate)}.`
              : "Run an analysis to calculate your latest ATS score."
          }
        />
        <DashboardMetricCard
          label="Jobs Matched"
          value={formatCount(overview.metrics.jobsMatched)}
          note={
            overview.savedJobs.error
              ? "Matched job data could not be loaded."
              : (overview.metrics.jobsMatched ?? 0) === 0
                ? "Search and save roles to build your scored match list."
                : "Counted from saved opportunities scored against your resume."
          }
        />
        <DashboardMetricCard
          label="Applications Sent"
          value={formatCount(overview.metrics.applicationsSent)}
          note={
            overview.campaigns.error
              ? "Campaign history could not be loaded."
              : (overview.metrics.applicationsSent ?? 0) === 0
                ? "Launch SmartSend when your CV is ready to reach companies in batches."
                : "Total emails sent across completed outreach campaigns."
          }
        />
        <DashboardMetricCard
          label="Interview Readiness"
          value={formatPercentage(overview.metrics.interviewReadiness)}
          note={
            overview.interviews.error
              ? "Interview history could not be loaded."
              : overview.metrics.interviewReadiness === null
                ? "Complete at least one mock interview to unlock readiness scoring."
                : `${interviewReadinessLabel(overview.metrics.interviewReadiness)} based on completed interview sessions.`
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recent Activity</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Latest actions in your workspace
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setRefreshIndex((value) => value + 1)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              Refresh
            </button>
          </div>

          {overview.recentActivity.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="text-base font-semibold text-slate-900">No workspace activity yet</p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Upload resumes, run analyses, save jobs, send campaigns, or complete interviews to start building your
                progress trail.
              </p>
              <Link
                href="/dashboard/resumes"
                className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Upload your first resume
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {overview.recentActivity.map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${ACTIVITY_STYLES[activity.kind]}`}
                        >
                          {activity.kind.replace("-", " ")}
                        </span>
                        {activity.status && (
                          <span className="text-xs font-medium capitalize text-slate-500">{activity.status}</span>
                        )}
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-950">{activity.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{activity.description}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{formatDateTime(activity.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>

        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recommended Next Step</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{overview.nextStep.label}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{overview.nextStep.description}</p>
          <Link
            href={overview.nextStep.href}
            className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Continue journey
          </Link>

          <div className="mt-6 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Decision Signals</p>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Active resume</span>
                <span className="font-semibold text-slate-900">{overview.metrics.activeResumeTitle ?? "Not set"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Journey completed</span>
                <span className="font-semibold text-slate-900">{overview.metrics.completedJourneySteps}/6</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Parsed resumes</span>
                <span className="font-semibold text-slate-900">{formatCount(parsedResumeCount)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Saved roles</span>
                <span className="font-semibold text-slate-900">{formatCount(savedJobCount)}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">{action.label}</h3>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
