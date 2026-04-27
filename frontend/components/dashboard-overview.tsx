"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Upload, BarChart3, Pencil, Search, Send, Mic, TrendingUp, Briefcase, SendHorizonal, MonitorPlay } from "lucide-react";

import { Panel } from "@/components/panel";
import { loadDashboardOverview, type DashboardActivityItem, type DashboardOverviewData } from "@/lib/dashboard";
import { atsLabel, interviewReadinessLabel } from "@/lib/product-insights";

/* ─────────────────────────────────────────────── helpers ── */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPercent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value)}%`;
}

function formatCount(count: number | null): string {
  if (count === null) return "—";
  return count.toLocaleString();
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 80) return "text-teal";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
}

/* ──────────────────────────────────────── circular progress ── */
function CircleProgress({
  percent,
  size = 56,
  strokeWidth = 4,
  colorClass = "text-teal",
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
}) {
  const r = size / 2 - strokeWidth * 1.5;
  const circumference = 2 * Math.PI * r;
  const dash = (Math.min(Math.max(percent, 0), 100) / 100) * circumference;
  const cx = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle cx={cx} cy={cx} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-slate-200" />
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        className={colorClass}
        stroke="currentColor"
      />
    </svg>
  );
}

/* ───────────────────────────────────────── inline SVG icons ── */
function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/* ───────────────────────────────────────────── step config ── */
type StepConfig = {
  icon: ReactNode;
  title: string;
  description: string;
  done: boolean;
  href: string;
  score?: number | null;
  badge?: string;
  iconBg: string;
  iconText: string;
};

/* ──────────────────────────────────── vertical journey stepper ── */
function JourneyTimeline({ steps }: { steps: StepConfig[] }) {
  const firstIncomplete = steps.findIndex((s) => !s.done);

  return (
    <div>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isCurrent = i === firstIncomplete;
        const hasScore = step.done && step.score !== null && step.score !== undefined;

        return (
          <div key={i} className="flex gap-3">
            {/* Connector column */}
            <div className="flex flex-col items-center">
              <Link href={step.href} tabIndex={-1} aria-hidden="true">
                <div
                  className={[
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    step.done
                      ? "border-teal bg-teal text-white"
                      : isCurrent
                        ? "border-brand-700 bg-brand-50 text-brand-700"
                        : "border-slate-200 bg-white text-slate-400",
                  ].join(" ")}
                >
                  {step.done ? <IconCheck /> : step.icon}
                </div>
              </Link>
              {!isLast && (
                <div
                  className={[
                    "my-1 w-0.5 flex-1 min-h-[1.25rem]",
                    step.done ? "bg-teal/30" : "bg-slate-200",
                  ].join(" ")}
                />
              )}
            </div>

            {/* Card */}
            <Link
              href={step.href}
              className={[
                "group mb-2 flex flex-1 items-start justify-between rounded-xl border p-3 transition-all",
                step.done
                  ? "border-teal/20 bg-teal-light/10 hover:bg-teal-light/20"
                  : isCurrent
                    ? "border-brand-200 bg-brand-50/50 hover:bg-brand-50"
                    : "border-slate-100 bg-white hover:border-slate-200",
              ].join(" ")}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "text-[13px] font-semibold",
                      step.done ? "text-teal" : isCurrent ? "text-brand-800" : "text-slate-500",
                    ].join(" ")}
                  >
                    {step.title}
                  </span>
                  {step.badge && (
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        step.done ? "bg-teal/15 text-teal" : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {step.badge}
                    </span>
                  )}
                </div>
                {!step.done && (
                  <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{step.description}</p>
                )}
              </div>

              <div className="ml-3 flex flex-shrink-0 items-center">
                {hasScore ? (
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-black ${scoreColor(step.score ?? null)}`}>
                      {Math.round(step.score!)}%
                    </span>
                    <CircleProgress
                      percent={step.score!}
                      size={28}
                      strokeWidth={2.5}
                      colorClass={step.score! >= 80 ? "text-teal" : step.score! >= 60 ? "text-amber-500" : "text-red-500"}
                    />
                  </div>
                ) : step.done ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4 text-teal">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className="text-slate-400 group-hover:text-slate-600">
                    <IconArrow />
                  </span>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────── application funnel ── */
function ApplicationFunnel({ overview }: { overview: DashboardOverviewData }) {
  const t = useTranslations();

  const cvs = (overview.resumes.data ?? []).filter((r) => r.processing_status === "parsed").length;
  const analyzed = (overview.analysisReports.data ?? []).filter((r) => r.status === "completed").length;
  const improved = (overview.enhancementReports.data ?? []).filter((r) => r.status === "completed").length;
  const sent = overview.metrics.applicationsSent ?? 0;
  const interviews = (overview.interviews.data ?? []).filter((i) => i.status === "completed").length;

  const stages = [
    { label: t("dashboardOverview.funnel.cvs"), value: cvs, icon: <Upload size={11} />, color: "text-violet-600 bg-violet-50 border-violet-200" },
    { label: t("dashboardOverview.funnel.analyzed"), value: analyzed, icon: <BarChart3 size={11} />, color: "text-amber-600 bg-amber-50 border-amber-200" },
    { label: t("dashboardOverview.funnel.improved"), value: improved, icon: <Pencil size={11} />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { label: t("dashboardOverview.funnel.sent"), value: sent, icon: <Send size={11} />, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
    { label: t("dashboardOverview.funnel.interviews"), value: interviews, icon: <Mic size={11} />, color: "text-rose-600 bg-rose-50 border-rose-200" },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {t("dashboardOverview.funnel.title")}
      </p>
      <div className="flex items-center gap-1.5">
        {stages.map((stage, i) => (
          <div key={i} className="flex items-center gap-1.5 flex-1">
            <div className={`flex flex-1 flex-col items-center rounded-lg border px-1 py-2 text-center ${stage.color}`}>
              <div className="mb-1">{stage.icon}</div>
              <span className="text-base font-black leading-none">{stage.value}</span>
              <span className="mt-0.5 text-[9px] font-semibold leading-tight">{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 flex-shrink-0 text-slate-300">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────── metric card ── */
function MetricCard({
  label,
  value,
  sub,
  colorClass = "text-slate-950",
  icon,
  iconBg = "bg-slate-100",
  iconColor = "text-slate-500",
}: {
  label: string;
  value: string;
  sub: string;
  colorClass?: string;
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
        {icon && (
          <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{sub}</p>
    </div>
  );
}

/* ────────────────────────────────────────────── smart nudges ── */
function SmartNudges({ overview }: { overview: DashboardOverviewData }) {
  const t = useTranslations();

  const savedJobsCount = overview.savedJobs.data?.length ?? 0;
  const sent = overview.metrics.applicationsSent ?? 0;
  const completedInterviews = (overview.interviews.data ?? []).filter((i) => i.status === "completed").length;
  const atsScore = overview.metrics.atsScore;

  type Nudge = { text: string; href: string; color: string };
  const nudges: Nudge[] = [];

  if (savedJobsCount > 0 && sent === 0) {
    nudges.push({
      text: t("dashboardOverview.nudges.sendSavedJobs", { count: savedJobsCount }),
      href: "/dashboard/smart-send",
      color: "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
    });
  }

  if (sent > 0 && completedInterviews === 0) {
    nudges.push({
      text: t("dashboardOverview.nudges.practiceInterview", { count: sent }),
      href: "/dashboard/ai-interview",
      color: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    });
  }

  if (atsScore !== null && atsScore < 65) {
    nudges.push({
      text: t("dashboardOverview.nudges.improveCV", { score: Math.round(atsScore) }),
      href: "/dashboard/enhancement",
      color: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    });
  }

  if (nudges.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {t("dashboardOverview.nudges.title")}
      </p>
      {nudges.slice(0, 2).map((nudge, i) => (
        <Link
          key={i}
          href={nudge.href}
          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition ${nudge.color}`}
        >
          <span>{nudge.text}</span>
          <IconArrow />
        </Link>
      ))}
    </div>
  );
}

/* ────────────────────────────── activity kind translation map ── */
const ACTIVITY_KIND_KEYS = {
  "resume": "dashboardOverview.activity.kinds.resume",
  "saved-job": "dashboardOverview.activity.kinds.savedJob",
  "analysis-report": "dashboardOverview.activity.kinds.analysisReport",
  "enhancement-report": "dashboardOverview.activity.kinds.enhancementReport",
  "interview": "dashboardOverview.activity.kinds.interview",
  "campaign": "dashboardOverview.activity.kinds.campaign",
} as const;

/* ──────────────────────────────── activity badge styles map ── */
const ACTIVITY_STYLES: Record<DashboardActivityItem["kind"], string> = {
  resume: "bg-brand-50 text-brand-700 border-brand-200",
  "saved-job": "bg-amber-50 text-amber-700 border-amber-200",
  "analysis-report": "bg-teal-light/40 text-teal border-teal-light",
  "enhancement-report": "bg-brand-50 text-brand-600 border-brand-100",
  interview: "bg-rose-50 text-rose-700 border-rose-200",
  campaign: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

/* ──────────────────────────────────────────────── hero card ── */
function HeroCard({
  overview,
  onRefresh,
}: {
  overview: DashboardOverviewData;
  onRefresh: () => void;
}) {
  const t = useTranslations();
  const completed = overview.metrics.completedJourneySteps;
  const total = 6;
  const pct = Math.round((completed / total) * 100);
  const ats = overview.metrics.atsScore;
  const jobs = overview.metrics.jobsMatched ?? 0;
  const sent = overview.metrics.applicationsSent ?? 0;

  const readinessLabel =
    pct === 100
      ? t("dashboardOverview.hero.readiness.complete")
      : pct >= 60
        ? t("dashboardOverview.hero.readiness.good")
        : t("dashboardOverview.hero.readiness.start");

  const stats = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      label: overview.metrics.activeResumeTitle ?? t("dashboardOverview.hero.stats.noResume"),
      active: !!overview.metrics.activeResumeTitle,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      label: ats !== null ? t("dashboardOverview.hero.stats.ats", { score: Math.round(ats) }) : t("dashboardOverview.hero.stats.notAnalyzed"),
      active: ats !== null,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      label: t("dashboardOverview.hero.stats.jobs", { count: jobs }),
      active: jobs > 0,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
      label: t("dashboardOverview.hero.stats.sent", { count: sent }),
      active: sent > 0,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 p-6 md:p-7">
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-brand-800/8 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-teal/10 blur-2xl" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        {/* Left: progress ring + stats */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-5">
            {/* Larger ring — 80px */}
            <div className="relative h-20 w-20 flex-shrink-0">
              <CircleProgress percent={pct} size={80} strokeWidth={5} colorClass="text-teal" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black leading-none text-brand-800">{pct}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">ready</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboardOverview.hero.professionalReadiness")}</p>
              <p className="text-lg font-bold text-slate-900">{readinessLabel}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t("dashboardOverview.hero.completedSteps", { completed, total })}
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={[
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  stat.active
                    ? "border-brand-200 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-slate-50 text-slate-500",
                ].join(" ")}
              >
                {stat.icon}
                <span className="max-w-[120px] truncate">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: next step CTA */}
        <div className="flex flex-col gap-2 md:min-w-[200px]">
          <Link
            href={overview.nextStep.href}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-800/20 transition hover:bg-brand-700"
          >
            {overview.nextStep.label}
            <IconArrow />
          </Link>
          <p className="text-center text-[10px] leading-5 text-slate-500">
            {overview.nextStep.description}
          </p>
          <button
            type="button"
            onClick={onRefresh}
            className="mt-1 text-center text-[10px] text-slate-400 transition hover:text-slate-600"
          >
            {t("dashboardOverview.hero.refresh")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────── loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
          <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════ main component ════ */
export function DashboardOverview() {
  const t = useTranslations();
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const data = await loadDashboardOverview();
      if (!cancelled) {
        setOverview(data);
        setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshIndex]);

  if (isLoading || !overview) return <LoadingSkeleton />;

  /* ── derive per-step done states ── */
  const parsedResumes = (overview.resumes.data ?? []).filter((r) => r.processing_status === "parsed");
  const step1Done = parsedResumes.length > 0;
  const step2Done = (overview.analysisReports.data ?? []).some((r) => r.status === "completed");
  const step3Done = (overview.enhancementReports.data ?? []).some((r) => r.status === "completed");
  const step4Done = (overview.metrics.jobsMatched ?? 0) > 0;
  const step5Done = (overview.metrics.applicationsSent ?? 0) > 0;
  const step6Done = (overview.interviews.data ?? []).some((i) => i.status === "completed");

  const resumeCount = parsedResumes.length;
  const savedJobsCount = overview.savedJobs.data?.length ?? 0;

  const interviewBestScore =
    overview.interviews.data
      ?.filter((i) => i.status === "completed" && i.overall_score !== null)
      .reduce<number | null>((best, i) => {
        const s = i.overall_score ?? 0;
        return best === null ? s : Math.max(best, s);
      }, null) ?? null;

  /* ── journey steps config ── */
  const journeySteps: StepConfig[] = [
    {
      icon: <Upload size={14} />,
      iconBg: "bg-violet-100", iconText: "text-violet-600",
      title: t("dashboardOverview.steps.upload.title"),
      description: t("dashboardOverview.steps.upload.description"),
      done: step1Done, href: "/dashboard/resumes",
      badge: step1Done ? t("dashboardOverview.steps.upload.badge", { count: resumeCount }) : undefined,
    },
    {
      icon: <BarChart3 size={14} />,
      iconBg: "bg-amber-100", iconText: "text-amber-600",
      title: t("dashboardOverview.steps.analyze.title"),
      description: t("dashboardOverview.steps.analyze.description"),
      done: step2Done, href: "/dashboard/analysis",
      score: step2Done ? overview.metrics.atsScore : null,
      badge: step2Done ? t("dashboardOverview.steps.analyze.badge") : undefined,
    },
    {
      icon: <Pencil size={14} />,
      iconBg: "bg-emerald-100", iconText: "text-emerald-600",
      title: t("dashboardOverview.steps.improve.title"),
      description: t("dashboardOverview.steps.improve.description"),
      done: step3Done, href: "/dashboard/enhancement",
      badge: step3Done ? t("dashboardOverview.steps.improve.badge") : undefined,
    },
    {
      icon: <Search size={14} />,
      iconBg: "bg-cyan-100", iconText: "text-cyan-600",
      title: t("dashboardOverview.steps.match.title"),
      description: t("dashboardOverview.steps.match.description"),
      done: step4Done, href: "/dashboard/job-search",
      badge: step4Done ? t("dashboardOverview.steps.match.badge", { count: savedJobsCount }) : undefined,
    },
    {
      icon: <Send size={14} />,
      iconBg: "bg-indigo-100", iconText: "text-indigo-600",
      title: t("dashboardOverview.steps.send.title"),
      description: t("dashboardOverview.steps.send.description"),
      done: step5Done, href: "/dashboard/smart-send",
      badge: step5Done ? t("dashboardOverview.steps.send.badge", { count: overview.metrics.applicationsSent }) : undefined,
    },
    {
      icon: <Mic size={14} />,
      iconBg: "bg-rose-100", iconText: "text-rose-600",
      title: t("dashboardOverview.steps.interview.title"),
      description: t("dashboardOverview.steps.interview.description"),
      done: step6Done, href: "/dashboard/ai-interview",
      score: step6Done ? interviewBestScore : null,
      badge: step6Done
        ? t("dashboardOverview.steps.interview.badge", {
            count: (overview.interviews.data ?? []).filter((i) => i.status === "completed").length,
          })
        : undefined,
    },
  ];

  /* ── failed collections warning ── */
  const failedLabels = [
    overview.resumes,
    overview.savedJobs,
    overview.analysisReports,
    overview.enhancementReports,
    overview.interviews,
    overview.campaigns,
  ]
    .filter((c) => c.error)
    .map((c) => c.label);

  return (
    <div className="space-y-6">
      {/* ── Hero ── */}
      <HeroCard overview={overview} onRefresh={() => setRefreshIndex((v) => v + 1)} />

      {/* ── Partial error warning ── */}
      {failedLabels.length > 0 && failedLabels.length < 6 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
          {t("dashboardOverview.warnings.partialUnavailable", { labels: failedLabels.join("، ") })}
        </div>
      )}

      {/* ── Full failure ── */}
      {failedLabels.length === 6 ? (
        <Panel className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {t("dashboardOverview.fullFailure.title")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            {t("dashboardOverview.fullFailure.description")}
          </p>
          <button
            type="button"
            onClick={() => setRefreshIndex((v) => v + 1)}
            className="mt-6 rounded-xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {t("dashboardOverview.fullFailure.retry")}
          </button>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* ── Left: Journey Timeline + Funnel ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-700">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {t("dashboardOverview.journey.title")}
              </h2>
              <span className="text-xs text-slate-500">
                {t("dashboardOverview.journey.progress", { completed: overview.metrics.completedJourneySteps, total: 6 })}
              </span>
            </div>

            <JourneyTimeline steps={journeySteps} />
            <ApplicationFunnel overview={overview} />
          </div>

          {/* ── Right: Metrics + Nudges + Activity ── */}
          <div className="space-y-4">
            {/* Metrics grid */}
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-700">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              {t("dashboardOverview.metrics.title")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label={t("dashboardOverview.metrics.atsScore")}
                value={formatPercent(overview.metrics.atsScore)}
                sub={atsLabel(overview.metrics.atsScore)}
                colorClass={scoreColor(overview.metrics.atsScore)}
                icon={<TrendingUp size={13} />}
                iconBg="bg-amber-100" iconColor="text-amber-600"
              />
              <MetricCard
                label={t("dashboardOverview.metrics.matchedJobs")}
                value={formatCount(overview.metrics.jobsMatched)}
                sub={overview.savedJobs.error ? t("dashboardOverview.metrics.unavailable") : t("dashboardOverview.metrics.fromSavedList")}
                icon={<Briefcase size={13} />}
                iconBg="bg-cyan-100" iconColor="text-cyan-600"
              />
              <MetricCard
                label={t("dashboardOverview.metrics.sentApplications")}
                value={formatCount(overview.metrics.applicationsSent)}
                sub={overview.campaigns.error ? t("dashboardOverview.metrics.unavailable") : t("dashboardOverview.metrics.viaSmartSend")}
                icon={<SendHorizonal size={13} />}
                iconBg="bg-indigo-100" iconColor="text-indigo-600"
              />
              <MetricCard
                label={t("dashboardOverview.metrics.interviewReadiness")}
                value={formatPercent(overview.metrics.interviewReadiness)}
                sub={interviewReadinessLabel(overview.metrics.interviewReadiness)}
                colorClass={scoreColor(overview.metrics.interviewReadiness)}
                icon={<MonitorPlay size={13} />}
                iconBg="bg-rose-100" iconColor="text-rose-600"
              />
            </div>

            {/* Smart nudges */}
            <SmartNudges overview={overview} />

            {/* Recent activity */}
            <div className="space-y-2.5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-700">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                {t("dashboardOverview.activity.title")}
              </h2>

              {overview.recentActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">{t("dashboardOverview.activity.emptyTitle")}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    {t("dashboardOverview.activity.emptyDescription")}
                  </p>
                  <Link
                    href="/dashboard/resumes"
                    className="mt-4 inline-flex rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    {t("dashboardOverview.activity.emptyCta")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {overview.recentActivity.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <span
                        className={`mt-0.5 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${ACTIVITY_STYLES[item.kind]}`}
                      >
                        {t(ACTIVITY_KIND_KEYS[item.kind])}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
