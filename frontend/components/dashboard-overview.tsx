"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

function scoreBg(score: number | null): string {
  if (score === null) return "bg-slate-200";
  if (score >= 80) return "bg-teal";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

/* ──────────────────────────────────── circular progress ── */
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

/* ───────────────────────────────────── inline SVG icons ── */
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

/* ─────────────────────────────────── journey step card ── */
type StepConfig = {
  icon: React.ReactNode;
  title: string;
  description: string;
  done: boolean;
  href: string;
  score?: number | null;
  badge?: string;
};

function JourneyStepCard({ step }: { step: StepConfig }) {
  const t = useTranslations();
  const { icon, title, description, done, href, score, badge } = step;
  const hasScore = score !== null && score !== undefined;

  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200",
        done
          ? "border-teal-light bg-teal-light/20 hover:border-teal/40 hover:bg-teal-light/35"
          : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/60 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Icon */}
      <div
        className={[
          "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-all",
          done
            ? "bg-teal text-white"
            : "bg-slate-100 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-700",
        ].join(" ")}
      >
        {done ? <IconCheck /> : icon}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              "text-sm font-bold",
              done ? "text-teal" : "text-slate-800 group-hover:text-brand-800",
            ].join(" ")}
          >
            {title}
          </span>
          {badge && (
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                done ? "bg-teal/15 text-teal" : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>

      {/* Right: score ring or arrow */}
      <div className="flex flex-shrink-0 items-center gap-2">
        {done && hasScore ? (
          <div className="flex items-center gap-1.5">
            <span className={`text-lg font-black ${scoreColor(score ?? null)}`}>{Math.round(score!)}%</span>
            <div className="relative">
              <CircleProgress
                percent={score!}
                size={32}
                strokeWidth={3}
                colorClass={score! >= 80 ? "text-teal" : score! >= 60 ? "text-amber-500" : "text-red-500"}
              />
            </div>
          </div>
        ) : done ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-teal">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition-colors group-hover:text-brand-600">
            {t("dashboard.overview.start")}
            <IconArrow />
          </div>
        )}
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────── hero card ── */
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
    pct === 100 ? t("dashboard.overview.readiness.complete") : pct >= 60 ? t("dashboard.overview.readiness.good") : t("dashboard.overview.readiness.start");

  const stats = [
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      label: overview.metrics.activeResumeTitle ?? t("dashboard.overview.noResume"),
      active: !!overview.metrics.activeResumeTitle,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      label: ats !== null ? `ATS: ${Math.round(ats)}%` : "لم يُحلَّل",
      label: ats !== null ? `ATS: ${Math.round(ats)}%` : t("dashboard.overview.stats.notAnalyzed"),
      active: ats !== null,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      label: `${jobs} وظيفة`,
      label: t("dashboard.overview.stats.jobsCount", { count: jobs }),
      active: jobs > 0,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
      label: `${sent} مُرسَل`,
      label: t("dashboard.overview.stats.sentCount", { count: sent }),
      active: sent > 0,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 p-6 md:p-7">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-brand-800/8 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-teal/10 blur-2xl" />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        {/* Left: progress ring + stats */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-4">
            {/* Ring */}
            <div className="relative h-16 w-16 flex-shrink-0">
              <CircleProgress percent={pct} size={64} strokeWidth={4} colorClass="text-teal" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-brand-800">
                {pct}%
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500">{t("dashboard.overview.readiness.label")}</p>
              <p className="text-base font-bold text-slate-900">{readinessLabel}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {t("dashboard.overview.readiness.steps", { completed, total })}
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
            {t("dashboard.overview.refresh")} ↺
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────── metric mini-card ── */
function MetricCard({
  label,
  value,
  sub,
  colorClass = "text-slate-950",
}: {
  label: string;
  value: string;
  sub: string;
  colorClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tracking-tight ${colorClass}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{sub}</p>
    </div>
  );
}

/* ─────────────────────────────── activity styles map ── */
const ACTIVITY_STYLES: Record<DashboardActivityItem["kind"], string> = {
  resume: "bg-brand-50 text-brand-700 border-brand-200",
  "saved-job": "bg-amber-50 text-amber-700 border-amber-200",
  "analysis-report": "bg-teal-light/40 text-teal border-teal-light",
  "enhancement-report": "bg-brand-50 text-brand-600 border-brand-100",
  interview: "bg-rose-50 text-rose-700 border-rose-200",
  campaign: "bg-cyan-50 text-cyan-700 border-cyan-200",
};

/* ──────────────────────────────── loading skeleton ── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ main component ════ */
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
    return () => { cancelled = true; };
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
  const campaignCount = overview.campaigns.data?.length ?? 0;

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
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
      title: "رفع السيرة الذاتية",
      description: "ارفع ملف PDF أو DOCX لبدء رحلتك المهنية",
      title: t("dashboard.overview.journey.step1.title"),
      description: t("dashboard.overview.journey.step1.desc"),
      done: step1Done,
      href: "/dashboard/resumes",
      badge: step1Done ? `${resumeCount} سيرة` : undefined,
      badge: step1Done ? t("dashboard.overview.stats.resumeCount", { count: resumeCount }) : undefined,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      title: "تحليل السيرة",
      description: "اكتشف المشاكل التي تمنع قبولك في الوظائف وقيّم مستوى ATS",
      title: t("dashboard.overview.journey.step2.title"),
      description: t("dashboard.overview.journey.step2.desc"),
      done: step2Done,
      href: "/dashboard/analysis",
      score: step2Done ? overview.metrics.atsScore : null,
      badge: step2Done ? "تم التحليل" : undefined,
      badge: step2Done ? t("dashboard.overview.stats.completed") : undefined,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
      title: "تحسين السيرة",
      description: "أعد كتابة سيرتك احترافياً متوافقة مع أنظمة ATS",
      title: t("dashboard.overview.journey.step3.title"),
      description: t("dashboard.overview.journey.step3.desc"),
      done: step3Done,
      href: "/dashboard/enhancement",
      badge: step3Done ? "تم التحسين" : undefined,
      badge: step3Done ? t("dashboard.overview.stats.completed") : undefined,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
      title: "مطابقة الوظائف",
      description: "ابحث عن الوظائف وطابق أقواها مع سيرتك الذاتية",
      title: t("dashboard.overview.journey.step4.title"),
      description: t("dashboard.overview.journey.step4.desc"),
      done: step4Done,
      href: "/dashboard/job-search",
      badge: step4Done ? `${savedJobsCount} وظيفة محفوظة` : undefined,
      badge: step4Done ? t("dashboard.overview.stats.jobsCount", { count: savedJobsCount }) : undefined,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      ),
      title: "إرسال SmartSend",
      description: "أرسل سيرتك إلى الشركات المناسبة بضغطة واحدة وتتبع التسليم",
      title: t("dashboard.overview.journey.step5.title"),
      description: t("dashboard.overview.journey.step5.desc"),
      done: step5Done,
      href: "/dashboard/smart-send",
      badge: step5Done ? `${overview.metrics.applicationsSent} مُرسَل` : undefined,
      badge: step5Done ? t("dashboard.overview.stats.sentCount", { count: overview.metrics.applicationsSent }) : undefined,
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: "تدريب المقابلات",
      description: "تدرّب على أسئلة واقعية وادخل مقابلتك بثقة كاملة",
      title: t("dashboard.overview.journey.step6.title"),
      description: t("dashboard.overview.journey.step6.desc"),
      done: step6Done,
      href: "/dashboard/ai-interview",
      score: step6Done ? interviewBestScore : null,
      badge: step6Done ? `${(overview.interviews.data ?? []).filter((i) => i.status === "completed").length} جلسة` : undefined,
      badge: step6Done ? t("dashboard.overview.stats.sessionCount", { count: (overview.interviews.data ?? []).filter((i) => i.status === "completed").length }) : undefined,
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
          {t("dashboard.overview.partialError", { labels: failedLabels.join("، ") })}
        </div>
      )}

      {/* ── Full failure ── */}
      {failedLabels.length === 6 ? (
        <Panel className="p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            تعذّر تحميل بيانات لوحة التحكم
            {t("dashboard.overview.errorTitle")}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            جميع المصادر فشلت في الاستجابة. لا يتم عرض بيانات افتراضية.
            {t("dashboard.overview.errorDesc")}
          </p>
          <button
            type="button"
            onClick={() => setRefreshIndex((v) => v + 1)}
            className="mt-6 rounded-xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            إعادة المحاولة
            {t("dashboard.overview.retry")}
          </button>
        </Panel>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          {/* ── Left: Journey Steps ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-700">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                رحلتك المهنية
                {t("dashboard.overview.journey.title")}
              </h2>
              <span className="text-xs text-slate-500">
                {overview.metrics.completedJourneySteps}/{6} مكتمل
                {t("dashboard.overview.journey.status", { completed: overview.metrics.completedJourneySteps, total: 6 })}
              </span>
            </div>

            <div className="space-y-2.5">
              {journeySteps.map((step, i) => (
                <JourneyStepCard key={i} step={step} />
              ))}
            </div>
          </div>

          {/* ── Right: Metrics + Activity ── */}
          <div className="space-y-4">
            {/* Metrics grid */}
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-700">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              المقاييس
              {t("dashboard.overview.metrics.title")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                label="درجة ATS"
                label={t("dashboard.overview.metrics.ats")}
                value={formatPercent(overview.metrics.atsScore)}
                sub={atsLabel(overview.metrics.atsScore)}
                colorClass={scoreColor(overview.metrics.atsScore)}
              />
              <MetricCard
                label="وظائف مطابقة"
                label={t("dashboard.overview.metrics.jobs")}
                value={formatCount(overview.metrics.jobsMatched)}
                sub={overview.savedJobs.error ? "غير متاح" : "من قائمة المحفوظة"}
                sub={overview.savedJobs.error ? t("dashboard.overview.metrics.unavailable") : t("dashboard.overview.metrics.jobsSub")}
              />
              <MetricCard
                label="طلبات مُرسلة"
                label={t("dashboard.overview.metrics.sent")}
                value={formatCount(overview.metrics.applicationsSent)}
                sub={overview.campaigns.error ? "غير متاح" : "عبر حملات SmartSend"}
                sub={overview.campaigns.error ? t("dashboard.overview.metrics.unavailable") : t("dashboard.overview.metrics.sentSub")}
              />
              <MetricCard
                label="جاهزية المقابلة"
                label={t("dashboard.overview.metrics.readiness")}
                value={formatPercent(overview.metrics.interviewReadiness)}
                sub={interviewReadinessLabel(overview.metrics.interviewReadiness)}
                colorClass={scoreColor(overview.metrics.interviewReadiness)}
              />
            </div>

            {/* Recent activity */}
            <div className="space-y-2.5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-700">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                آخر النشاطات
                {t("dashboard.overview.activity.title")}
              </h2>

              {overview.recentActivity.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">لا نشاط بعد</p>
                  <p className="text-sm font-semibold text-slate-700">{t("dashboard.overview.activity.emptyTitle")}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    ارفع سيرتك وابدأ رحلتك لتظهر نشاطاتك هنا.
                    {t("dashboard.overview.activity.emptyDesc")}
                  </p>
                  <Link
                    href="/dashboard/resumes"
                    className="mt-4 inline-flex rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    ارفع سيرتك الأولى
                    {t("dashboard.overview.activity.emptyCta")}
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
                        className={`mt-0.5 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold capitalize ${ACTIVITY_STYLES[item.kind]}`}
                      >
                        {item.kind.replace("-", " ")}
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

            {/* Quick access */}
            <div className="space-y-2.5">
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-brand-700">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                وصول سريع
                {t("dashboard.overview.quickAccess.title")}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "سيرتي الذاتية", href: "/dashboard/resumes", icon: (
                  { label: t("dashboard.overview.quickAccess.resumes"), href: "/dashboard/resumes", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                  )},
                  { label: "التحليل", href: "/dashboard/analysis", icon: (
                  { label: t("dashboard.overview.quickAccess.analysis"), href: "/dashboard/analysis", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  )},
                  { label: "بحث الوظائف", href: "/dashboard/job-search", icon: (
                  { label: t("dashboard.overview.quickAccess.jobs"), href: "/dashboard/job-search", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  )},
                  { label: "SmartSend", href: "/dashboard/smart-send", icon: (
                  { label: t("dashboard.overview.quickAccess.smartSend"), href: "/dashboard/smart-send", icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )},
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      {item.icon}
                    </div>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
