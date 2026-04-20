"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/panel";
import { ApiError } from "@/lib/api";
import { buildJobMatchInsights } from "@/lib/product-insights";
import {
  getSavedJobs,
  prefillAnalysisWithJob,
  prefillSmartSendWithJob,
  saveJob,
  searchJobs,
  unsaveJobByExternalId,
} from "@/lib/jobs";
import { listResumes } from "@/lib/resumes";
import type { JobResult, ResumeListItem, SavedJob } from "@/types";

const DATE_VALUES = ["all", "today", "3days", "week", "month"] as const;
type DateValue = (typeof DATE_VALUES)[number];

const TYPE_VALUES = [
  { value: "", key: "allTypes" },
  { value: "FULLTIME", key: "fullTime" },
  { value: "PARTTIME", key: "partTime" },
  { value: "CONTRACTOR", key: "contract" },
  { value: "INTERN", key: "internship" },
] as const;

type PageState = "idle" | "searching" | "results" | "error";
type ActiveTab = "search" | "saved";

function formatSalary(min: number | null, max: number | null, currency: string | null): string | null {
  if (!min && !max) return null;
  const resolvedCurrency = currency ?? "SAR";
  if (min && max) return `${resolvedCurrency} ${min.toLocaleString()}-${max.toLocaleString()}`;
  if (min) return `${resolvedCurrency} ${min.toLocaleString()}+`;
  if (max) return `Up to ${resolvedCurrency} ${max.toLocaleString()}`;
  return null;
}

function FitBadge({ score }: { score: number | null }) {
  const t = useTranslations("jobSearchPage");

  if (score === null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        {t("jobCard.resumeScoringOff")}
      </span>
    );
  }

  const rounded = Math.round(score);
  const classes =
    rounded >= 70
      ? "bg-teal-light/30 border-teal-light text-teal"
      : rounded >= 45
        ? "bg-amber-50 border-amber-200 text-amber-700"
        : "bg-rose-50 border-rose-200 text-rose-700";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classes}`}>
      {t("jobCard.matchPercent", { score: rounded })}
    </span>
  );
}

function EmploymentBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
      {type}
    </span>
  );
}

function ScoreHeader({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>
    </div>
  );
}

function JobCard({
  job,
  savingId,
  onSave,
  onUnsave,
  onAnalyze,
  onSmartSend,
  onPracticeInterview,
}: {
  job: JobResult;
  savingId: string | null;
  onSave: (job: JobResult) => void;
  onUnsave: (jobId: string) => void;
  onAnalyze: (job: JobResult) => void;
  onSmartSend: (job: JobResult) => void;
  onPracticeInterview: (job: JobResult) => void;
}) {
  const t = useTranslations("jobSearchPage");
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const isBusy = savingId === job.job_id;
  const insights = buildJobMatchInsights(job);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-950">{job.job_title}</p>
            <FitBadge score={job.fit_score} />
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{job.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {job.location && <span>{job.location}</span>}
            {job.location && job.employment_type && <span>-</span>}
            <EmploymentBadge type={job.employment_type} />
            {salary && (
              <>
                <span>-</span>
                <span className="font-medium text-slate-600">{salary}</span>
              </>
            )}
          </div>
        </div>

        {job.employer_logo ? (
          <img
            src={job.employer_logo}
            alt={job.company_name}
            className="h-10 w-10 rounded-xl border border-slate-100 object-contain p-1"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400">
            {job.company_name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{insights.headline}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal">{t("jobCard.whyItMatches")}</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
              {insights.reasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">{t("jobCard.howToImprove")}</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-600">
              {insights.suggestions.map((suggestion) => (
                <li key={suggestion}>- {suggestion}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {job.source && <p className="text-[10px] text-slate-400">{t("jobCard.source", { source: job.source })}</p>}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={isBusy}
          onClick={() => (job.is_saved ? onUnsave(job.job_id) : onSave(job))}
          className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
            job.is_saved
              ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
          }`}
        >
          {job.is_saved ? t("jobCard.savedToShortlist") : t("jobCard.saveRole")}
        </button>

        {job.job_description ? (
          <button
            type="button"
            onClick={() => onAnalyze(job)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {t("jobCard.analyzeAgainstCv")}
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
            {t("jobCard.noJdAvailable")}
          </div>
        )}

        {job.job_description ? (
          <button
            type="button"
            onClick={() => onSmartSend(job)}
            className="rounded-xl border border-teal-light bg-teal-light/20 px-3 py-2 text-xs font-semibold text-teal transition hover:bg-teal-light/40"
          >
            {t("jobCard.addToSmartSend")}
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
            {t("jobCard.smartSendNeedsContext")}
          </div>
        )}

        {job.job_description ? (
          <button
            type="button"
            onClick={() => onPracticeInterview(job)}
            className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            {t("jobCard.practiceInterview")}
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
            {t("jobCard.interviewPrepNeedsContext")}
          </div>
        )}
      </div>

      {job.apply_link && (
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {t("jobCard.openExternalApplication")}
        </a>
      )}
    </div>
  );
}

function SavedJobCard({
  job,
  removingId,
  onRemove,
  onAnalyze,
  onSmartSend,
  onPracticeInterview,
}: {
  job: SavedJob;
  removingId: string | null;
  onRemove: (id: string) => void;
  onAnalyze: (job: SavedJob) => void;
  onSmartSend: (job: SavedJob) => void;
  onPracticeInterview: (job: SavedJob) => void;
}) {
  const t = useTranslations("jobSearchPage");
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-950">{job.job_title}</p>
            <FitBadge score={job.fit_score} />
          </div>
          <p className="mt-1 truncate text-xs text-slate-500">{job.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {job.location && <span>{job.location}</span>}
            {job.location && job.employment_type && <span>-</span>}
            <EmploymentBadge type={job.employment_type} />
            {salary && (
              <>
                <span>-</span>
                <span>{salary}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          disabled={removingId === job.job_id}
          onClick={() => onRemove(job.job_id)}
          className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          {t("jobCard.removeFromSaved")}
        </button>
        {job.job_description ? (
          <button
            type="button"
            onClick={() => onAnalyze(job)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {t("jobCard.analyzeAgainstCv")}
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
            {t("jobCard.noJdAvailable")}
          </div>
        )}
        {job.job_description ? (
          <button
            type="button"
            onClick={() => onSmartSend(job)}
            className="rounded-xl border border-teal-light bg-teal-light/20 px-3 py-2 text-xs font-semibold text-teal transition hover:bg-teal-light/40"
          >
            {t("jobCard.addToSmartSend")}
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
            {t("jobCard.smartSendNeedsContext")}
          </div>
        )}
        {job.job_description ? (
          <button
            type="button"
            onClick={() => onPracticeInterview(job)}
            className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            {t("jobCard.practiceInterview")}
          </button>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-2 text-center text-xs text-slate-400">
            {t("jobCard.interviewPrepNeedsContext")}
          </div>
        )}
      </div>

      {job.apply_link && (
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          {t("jobCard.openExternalApplication")}
        </a>
      )}
    </div>
  );
}

export default function DashboardJobSearchPage() {
  const t = useTranslations("jobSearchPage");
  const router = useRouter();

  const DATE_OPTIONS: { value: DateValue; label: string }[] = [
    { value: "all", label: t("filters.anyTime") },
    { value: "today", label: t("filters.today") },
    { value: "3days", label: t("filters.last3Days") },
    { value: "week", label: t("filters.lastWeek") },
    { value: "month", label: t("filters.lastMonth") },
  ];

  const TYPE_OPTIONS = TYPE_VALUES.map((opt) => ({
    value: opt.value,
    label: t(`filters.${opt.key}`),
  }));

  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [datePosted, setDatePosted] = useState<DateValue>("all");
  const [employmentType, setEmploymentType] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);

  const [pageState, setPageState] = useState<PageState>("idle");
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState<JobResult[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastQuery, setLastQuery] = useState<{ q: string; loc: string } | null>(null);

  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("search");

  const resultsRef = useRef<HTMLDivElement>(null);

  const loadInitialData = useCallback(async () => {
    const [resumeList, saved] = await Promise.all([
      listResumes().catch(() => [] as ResumeListItem[]),
      getSavedJobs().catch(() => [] as SavedJob[]),
    ]);

    setResumes(resumeList);
    setSavedJobs(saved);
    if (resumeList.length > 0) {
      setResumeId((currentValue) => currentValue || resumeList[0].id);
    }
  }, []);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  async function handleSearch(page = 1) {
    if (!query.trim()) return;

    setPageState("searching");
    setSearchError("");
    if (page === 1) setResults([]);

    try {
      const response = await searchJobs({
        q: query.trim(),
        location: location.trim() || undefined,
        page,
        date_posted: datePosted,
        employment_type: employmentType || undefined,
        resume_id: resumeId || undefined,
      });

      const savedIds = new Set(savedJobs.map((job) => job.job_id));
      const merged = response.results.map((job) => ({ ...job, is_saved: savedIds.has(job.job_id) }));

      setResults((previous) => (page === 1 ? merged : [...previous, ...merged]));
      setTotalFound(response.total_found);
      setCurrentPage(page);
      setLastQuery({ q: query.trim(), loc: location.trim() });
      setPageState("results");

      if (page === 1) {
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch (error) {
      setSearchError(error instanceof ApiError ? error.detail : "Search failed. Please try again.");
      setPageState("error");
    }
  }

  async function handleLoadMore() {
    await handleSearch(currentPage + 1);
  }

  async function handleSave(job: JobResult) {
    setSavingId(job.job_id);
    try {
      const saved = await saveJob(job);
      setSavedJobs((previous) => [saved, ...previous]);
      setResults((previous) => previous.map((item) => (item.job_id === job.job_id ? { ...item, is_saved: true } : item)));
    } finally {
      setSavingId(null);
    }
  }

  async function handleUnsave(jobId: string) {
    setSavingId(jobId);
    try {
      await unsaveJobByExternalId(jobId);
      setSavedJobs((previous) => previous.filter((job) => job.job_id !== jobId));
      setResults((previous) => previous.map((item) => (item.job_id === jobId ? { ...item, is_saved: false } : item)));
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemoveSaved(jobId: string) {
    setRemovingId(jobId);
    try {
      await unsaveJobByExternalId(jobId);
      setSavedJobs((previous) => previous.filter((job) => job.job_id !== jobId));
      setResults((previous) => previous.map((item) => (item.job_id === jobId ? { ...item, is_saved: false } : item)));
    } finally {
      setRemovingId(null);
    }
  }

  function handleAnalyze(job: { job_title: string; job_description: string | null }) {
    if (!job.job_description) return;
    prefillAnalysisWithJob(job.job_title, job.job_description);
    router.push("/dashboard/analysis");
  }

  function handleSmartSend(job: { job_title: string; company_name: string; job_description: string | null }) {
    prefillSmartSendWithJob({
      job_title: job.job_title,
      company_name: job.company_name,
      job_description: job.job_description,
    });
    router.push("/dashboard/smart-send");
  }

  function handlePracticeInterview(job: { job_title: string; job_description: string | null }) {
    if (typeof window !== "undefined" && job.job_description) {
      sessionStorage.setItem("jobai_interview_jd", job.job_description);
      sessionStorage.setItem("jobai_interview_jd_title", job.job_title);
    }
    router.push("/dashboard/ai-interview");
  }

  const canSearch = query.trim().length > 0 && pageState !== "searching";
  const hasMore = results.length > 0 && results.length < totalFound;
  const matchedSavedCount = savedJobs.filter((job) => (job.fit_score ?? 0) >= 55).length;
  const activeResume = resumes.find((resume) => resume.id === resumeId) ?? null;
  const nextActionHref = savedJobs.length > 0 ? "/dashboard/smart-send" : "/dashboard/analysis";
  const nextActionLabel = savedJobs.length > 0 ? t("nextStep.launchSmartSend") : t("nextStep.runCvAnalysis");

  return (
    <div className="space-y-6">
      <Panel className="overflow-hidden">
        <div className="border-b border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 px-6 py-7 md:px-8 md:py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("step")}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                {t("title")}
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {t("description")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("focus.label")}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {savedJobs.length > 0 ? t("focus.turnToAction") : t("focus.buildShortlist")}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {savedJobs.length > 0
                    ? t("focus.promising", { count: matchedSavedCount })
                    : t("focus.startBroad")}
                </p>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">{t("nextStep.label")}</p>
                <p className="text-sm font-semibold text-slate-950">{nextActionLabel}</p>
                <Link
                  href={nextActionHref}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700"
                >
                  {t("nextStep.continueWorkflow")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-5 lg:grid-cols-3 md:px-8">
          <ScoreHeader
            label={t("headers.activeResume")}
            value={activeResume?.source_filename ?? activeResume?.title ?? t("headers.noneSelected")}
            note={resumeId ? t("headers.scoresUseCv") : t("headers.pickCv")}
          />
          <ScoreHeader
            label={t("headers.savedRoles")}
            value={savedJobs.length.toString()}
            note={savedJobs.length > 0 ? t("headers.savedLookPromising", { count: matchedSavedCount }) : t("headers.saveStrongJobs")}
          />
          <ScoreHeader
            label={t("headers.decisionMode")}
            value={resumeId ? t("headers.personalizedMatching") : t("headers.manualScouting")}
            note={resumeId ? t("headers.useFitSignals") : t("headers.resultsImproveAfterCv")}
          />
        </div>
      </Panel>

      <Panel className="p-5 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && canSearch) {
                  void handleSearch(1);
                }
              }}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-4 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canSearch) {
                void handleSearch(1);
              }
            }}
            placeholder={t("locationPlaceholder")}
            className="sm:w-52 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none"
          />

          <button
            type="button"
            disabled={!canSearch}
            onClick={() => void handleSearch(1)}
            className="inline-flex items-center justify-center rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pageState === "searching" ? t("searching") : t("searchJobs")}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select
            value={datePosted}
            onChange={(event) => setDatePosted(event.target.value as DateValue)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            {DATE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={employmentType}
            onChange={(event) => setEmploymentType(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {resumes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{t("filters.scoreWith")}</span>
              <select
                value={resumeId}
                onChange={(event) => setResumeId(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
              >
                <option value="">{t("filters.noScore")}</option>
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.source_filename ?? resume.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </Panel>

      <div className="flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
        {(["search", "saved"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              activeTab === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "search"
              ? results.length > 0
                ? t("tabs.searchResultsWithCount", { count: results.length })
                : t("tabs.searchResults")
              : t("tabs.saved", { count: savedJobs.length })}
          </button>
        ))}
      </div>

      {activeTab === "search" && (
        <div ref={resultsRef} className="space-y-4">
          {pageState === "error" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {searchError}
            </div>
          )}

          {pageState === "idle" && (
            <Panel className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">{t("results.idleTitle")}</p>
              <p className="mt-1 text-xs text-slate-500">
                {t("results.idleDesc")}
              </p>
            </Panel>
          )}

          {pageState === "searching" && currentPage === 1 && (
            <div className="grid gap-4 xl:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
              ))}
            </div>
          )}

          {(pageState === "results" || (pageState === "searching" && currentPage > 1)) && results.length > 0 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <p>
                  {t("results.showing", { current: results.length, total: totalFound.toLocaleString() })}
                  {lastQuery && (
                    <>
                      {" "}{t("results.for")} <span className="font-medium text-slate-700">{lastQuery.q}</span>
                      {lastQuery.loc && <> {t("results.in")} <span className="font-medium text-slate-700">{lastQuery.loc}</span></>}
                    </>
                  )}
                </p>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-semibold text-slate-600">
                  {resumeId ? t("results.resumeScoringOn") : t("results.resumeScoringOff")}
                </span>
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {results.map((job) => (
                  <JobCard
                    key={job.job_id}
                    job={job}
                    savingId={savingId}
                    onSave={handleSave}
                    onUnsave={handleUnsave}
                    onAnalyze={handleAnalyze}
                    onSmartSend={handleSmartSend}
                    onPracticeInterview={handlePracticeInterview}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => void handleLoadMore()}
                    disabled={pageState === "searching"}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-50"
                  >
                    {t("results.loadMore")}
                  </button>
                </div>
              )}
            </>
          )}

          {pageState === "results" && results.length === 0 && (
            <Panel className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">{t("results.noJobsFound")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("results.tryBroader")}</p>
            </Panel>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-4">
          {savedJobs.length === 0 ? (
            <Panel className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-slate-900">{t("savedJobs.empty")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("savedJobs.emptyDesc")}</p>
            </Panel>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                {t("savedJobs.count", { count: savedJobs.length })}
              </p>
              <div className="grid gap-4 xl:grid-cols-2">
                {savedJobs.map((job) => (
                  <SavedJobCard
                    key={job.id}
                    job={job}
                    removingId={removingId}
                    onRemove={handleRemoveSaved}
                    onAnalyze={handleAnalyze}
                    onSmartSend={handleSmartSend}
                    onPracticeInterview={handlePracticeInterview}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
