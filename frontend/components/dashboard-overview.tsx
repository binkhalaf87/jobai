"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/panel";
import { loadDashboardOverview, type DashboardActivityItem, type DashboardOverviewData } from "@/lib/dashboard";

// ─── Journey Progress ────────────────────────────────────────────────────────

type JourneyStep = {
  num: number;
  label: string;
  href: string;
  done: boolean;
  active: boolean;
};

function JourneyProgress({ overview }: { overview: DashboardOverviewData }) {
  const hasResume = (overview.resumes.data?.length ?? 0) > 0;
  const hasReport = (overview.analysisReports.data?.filter((r) => r.status === "completed").length ?? 0) > 0;
  const hasSavedJob = (overview.savedJobs.data?.length ?? 0) > 0;
  const hasInterview = (overview.interviews.data?.filter((i) => i.status === "completed").length ?? 0) > 0;

  // First incomplete step determines the active one
  const steps: JourneyStep[] = [
    { num: 1, label: "Upload CV",       href: "/dashboard/resumes",     done: hasResume,    active: false },
    { num: 2, label: "Analyze CV",      href: "/dashboard/analysis",    done: hasReport,    active: false },
    { num: 3, label: "Improve CV",      href: "/dashboard/enhancement", done: false,        active: false },
    { num: 4, label: "Match Jobs",      href: "/dashboard/job-search",  done: hasSavedJob,  active: false },
    { num: 5, label: "Apply",           href: "/dashboard/smart-send",  done: false,        active: false },
    { num: 6, label: "Practice Interview", href: "/dashboard/ai-interview", done: hasInterview, active: false },
  ];

  const firstIncomplete = steps.findIndex((s) => !s.done);
  if (firstIncomplete !== -1) steps[firstIncomplete]!.active = true;

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your Journey</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            {doneCount === 0
              ? "Start your job search journey"
              : doneCount === steps.length
              ? "Journey complete — keep it up!"
              : `${doneCount} of ${steps.length} steps completed`}
          </p>
        </div>
        <div className="shrink-0">
          <div className="flex items-center gap-1">
            {steps.map((s) => (
              <div
                key={s.num}
                className={`h-1.5 w-7 rounded-full transition-all ${
                  s.done ? "bg-emerald-500" : s.active ? "bg-violet-400" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {steps.map((s) => (
          <Link
            key={s.num}
            href={s.href}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition ${
              s.done
                ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                : s.active
                ? "border-violet-300 bg-violet-50 hover:bg-violet-100"
                : "border-slate-200 bg-slate-50 hover:bg-white"
            }`}
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
              s.done
                ? "bg-emerald-500 text-white"
                : s.active
                ? "bg-violet-500 text-white"
                : "bg-slate-200 text-slate-500"
            }`}>
              {s.done ? "✓" : s.num}
            </span>
            <p className={`text-[10px] font-semibold leading-tight ${
              s.done ? "text-emerald-700" : s.active ? "text-violet-700" : "text-slate-500"
            }`}>
              {s.label}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

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
};

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
  if (count === null) {
    return "—";
  }

  return `${count.toLocaleString()}${suffix}`;
}

function formatPercentage(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return `${Math.round(value)}%`;
}

function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
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
      label: "New Analysis",
      href: "/dashboard/analysis",
      description:
        resumes == null
          ? "Resume data is unavailable right now."
          : parsedResumes > 0
            ? `${pluralize(parsedResumes, "resume")} ready for analysis.`
            : "Upload and parse a resume to start your first report.",
    },
    {
      label: "My Resumes",
      href: "/dashboard/resumes",
      description:
        resumes == null
          ? "Resume library is temporarily unavailable."
          : resumes.length > 0
            ? `${pluralize(resumes.length, "resume")} stored in your workspace.`
            : "No resumes uploaded yet.",
    },
    {
      label: "Job Search",
      href: "/dashboard/job-search",
      description:
        savedJobs == null
          ? "Saved job data is unavailable right now."
          : savedJobs.length > 0
            ? `${pluralize(savedJobs.length, "saved job")} ready to revisit.`
            : "Search and save roles you want to track.",
    },
    {
      label: "AI Interview",
      href: "/dashboard/ai-interview",
      description:
        interviews == null
          ? "Interview history is unavailable right now."
          : completedInterviews > 0
            ? `${pluralize(completedInterviews, "completed interview")} on record.`
            : completedAnalysisReports > 0
              ? "Use your current reports to prepare for interviews."
              : "Practice your first interview when you are ready.",
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
  ].filter((collection) => collection.error);

  const allCollectionsFailed = failedCollections.length === 5;

  if (allCollectionsFailed) {
    return (
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Dashboard Overview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Live workspace data could not be loaded
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          The dashboard is configured to show only real data. Every data source failed to respond, so no placeholder
          values are being shown.
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

  const resumeCount = overview.resumes.data?.length ?? null;
  const parsedResumeCount = overview.resumes.data?.filter((resume) => resume.processing_status === "parsed").length ?? null;
  const savedJobsCount = overview.savedJobs.data?.length ?? null;
  const completedReportCount =
    overview.analysisReports.data == null || overview.enhancementReports.data == null
      ? null
      : [...overview.analysisReports.data, ...overview.enhancementReports.data].filter(
          (report) => report.status === "completed",
        ).length;
  const totalReportCount =
    overview.analysisReports.data == null || overview.enhancementReports.data == null
      ? null
      : overview.analysisReports.data.length + overview.enhancementReports.data.length;
  const completedInterviews = overview.interviews.data?.filter((interview) => interview.status === "completed") ?? null;
  const averageInterviewScore =
    completedInterviews && completedInterviews.length > 0
      ? completedInterviews.reduce((total, interview) => total + (interview.overall_score ?? 0), 0) /
        completedInterviews.length
      : null;
  const latestActivity = overview.recentActivity[0] ?? null;
  const quickActions = buildQuickActions(overview);

  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Dashboard Overview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Your workspace snapshot is live
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          {resumeCount != null && savedJobsCount != null && totalReportCount != null && overview.interviews.data != null
            ? `You currently have ${pluralize(resumeCount, "resume")}, ${pluralize(savedJobsCount, "saved job")}, ${pluralize(totalReportCount, "AI report")}, and ${pluralize(overview.interviews.data.length, "interview session")} in your account.`
            : "This overview is showing live workspace data only. Any section that could not be loaded is marked as unavailable instead of showing placeholder numbers."}
        </p>
        {latestActivity && (
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Latest activity: <span className="font-semibold text-slate-800">{latestActivity.title}</span> on{" "}
            {formatDateTime(latestActivity.createdAt)}.
          </p>
        )}
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
          label="Resumes Uploaded"
          value={formatCount(resumeCount)}
          note={
            overview.resumes.error
              ? "Resume library could not be loaded."
              : parsedResumeCount === 0
                ? "No parsed resumes are ready yet."
                : `${formatCount(parsedResumeCount)} parsed and ready to use.`
          }
        />
        <DashboardMetricCard
          label="Saved Jobs"
          value={formatCount(savedJobsCount)}
          note={
            overview.savedJobs.error
              ? "Saved job data could not be loaded."
              : savedJobsCount === 0
                ? "No jobs saved yet."
                : "Saved roles are ready in Job Search."
          }
        />
        <DashboardMetricCard
          label="Completed Reports"
          value={formatCount(completedReportCount)}
          note={
            overview.analysisReports.error || overview.enhancementReports.error
              ? "Report history is partially unavailable."
              : totalReportCount === 0
                ? "No AI reports have been generated yet."
                : `${formatCount(totalReportCount)} total reports across analysis and enhancement.`
          }
        />
        <DashboardMetricCard
          label="Interview Average"
          value={formatPercentage(averageInterviewScore)}
          note={
            overview.interviews.error
              ? "Interview history could not be loaded."
              : completedInterviews == null || completedInterviews.length === 0
                ? "No completed interview sessions yet."
                : `${pluralize(completedInterviews.length, "completed session")} contributing to this average.`
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
                When you upload resumes, save jobs, generate reports, or finish interviews, the latest activity will
                appear here.
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
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Actions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Continue from real progress</h2>
          <div className="mt-6 space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
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
