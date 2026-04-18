"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/panel";
import { api } from "@/lib/api";

type Job = {
  id: string;
  title: string;
  company_name: string | null;
};

type Candidate = {
  id: string;
  title: string;
  parsed_name: string | null;
  stage: string;
};

type InterviewQuestion = {
  index: number;
  question: string;
  type: string;
  focus_area: string | null;
};

type GeneratedInterview = {
  id: string;
  candidate_name: string;
  job_title: string;
  interview_type: string;
  language: string;
  candidate_summary: string;
  focus_areas: string[];
  questions: InterviewQuestion[];
  created_at: string;
};

type InterviewListItem = {
  id: string;
  resume_id: string;
  job_id: string;
  candidate_name: string;
  job_title: string;
  interview_type: string;
  question_count: number;
  status: string;
  created_at: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function typeBadge(type: string) {
  const map: Record<string, string> = {
    hr: "bg-sky-100 text-sky-700",
    technical: "bg-violet-100 text-violet-700",
    mixed: "bg-slate-100 text-slate-700",
  };
  return map[type] ?? "bg-slate-100 text-slate-600";
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    hr: "HR / Behavioral",
    technical: "Technical",
    mixed: "Mixed",
  };
  return map[type] ?? type;
}

export default function AIInterviewPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [history, setHistory] = useState<InterviewListItem[]>([]);
  const [loadingSetup, setLoadingSetup] = useState(true);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [interviewType, setInterviewType] = useState<"hr" | "technical" | "mixed">("mixed");
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [questionCount, setQuestionCount] = useState(8);

  const [generating, setGenerating] = useState(false);
  const [activeInterview, setActiveInterview] = useState<GeneratedInterview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSetup() {
      try {
        const [jobsData, candidatesData, historyData] = await Promise.all([
          api.get<Job[]>("/recruiter/jobs/", { auth: true }),
          api.get<Candidate[]>("/recruiter/candidates/", { auth: true }),
          api.get<InterviewListItem[]>("/recruiter/interviews/", { auth: true }),
        ]);
        setJobs(jobsData);
        setCandidates(candidatesData);
        setHistory(historyData);
        if (jobsData.length > 0) setSelectedJobId(jobsData[0].id);
        if (candidatesData.length > 0) setSelectedCandidateId(candidatesData[0].id);
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoadingSetup(false);
      }
    }
    void loadSetup();
  }, []);

  async function generate() {
    if (!selectedJobId || !selectedCandidateId) return;
    setGenerating(true);
    setError(null);
    setActiveInterview(null);
    try {
      const data = await api.post<GeneratedInterview>(
        "/recruiter/interviews/",
        {
          resume_id: selectedCandidateId,
          job_id: selectedJobId,
          interview_type: interviewType,
          language,
          question_count: questionCount,
        },
        { auth: true }
      );
      setActiveInterview(data);
      const updated = await api.get<InterviewListItem[]>("/recruiter/interviews/", { auth: true });
      setHistory(updated);
    } catch {
      setError("Failed to generate interview questions. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function loadHistoryItem(id: string) {
    setError(null);
    try {
      const data = await api.get<GeneratedInterview>(`/recruiter/interviews/${id}`, { auth: true });
      setActiveInterview(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Failed to load interview.");
    }
  }

  if (loadingSetup) {
    return (
      <Panel className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="h-40 rounded bg-slate-100" />
        </div>
      </Panel>
    );
  }

  const noData = jobs.length === 0 || candidates.length === 0;

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Panel className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Interview</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Generate tailored interview questions
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pick a candidate and a job — the AI reads the resume and job description together to produce
          role-specific, candidate-specific questions you can use in the real interview.
        </p>

        {noData ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-900">
              {jobs.length === 0 ? "No jobs found" : "No candidates found"}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {jobs.length === 0
                ? "Add at least one job before generating interview questions."
                : "Upload candidate resumes before generating interview questions."}
            </p>
            <Link
              href={jobs.length === 0 ? "/recruiter/jobs" : "/recruiter/candidates"}
              className="mt-4 inline-flex rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {jobs.length === 0 ? "Add a job" : "Upload candidates"}
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Candidate</label>
                <select
                  value={selectedCandidateId}
                  onChange={(e) => setSelectedCandidateId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parsed_name ?? c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Job</label>
                <select
                  value={selectedJobId}
                  onChange={(e) => setSelectedJobId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}{job.company_name ? ` — ${job.company_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Interview Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as "hr" | "technical" | "mixed")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="mixed">Mixed (HR + Technical)</option>
                  <option value="hr">HR / Behavioral</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "ar")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  Questions: {questionCount}
                </label>
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="mt-2.5 w-full"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => void generate()}
                disabled={generating || !selectedJobId || !selectedCandidateId}
                className="rounded-2xl bg-brand-800 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {generating ? "Generating questions…" : "Generate Interview"}
              </button>
            </div>
          </div>
        )}
      </Panel>

      {error && (
        <Panel className="border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-semibold text-rose-700">{error}</p>
        </Panel>
      )}

      {/* Generated question set */}
      {activeInterview && (
        <Panel className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Generated Questions</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                {activeInterview.candidate_name}
                <span className="font-normal text-slate-500"> for </span>
                {activeInterview.job_title}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge(activeInterview.interview_type)}`}>
                  {typeLabel(activeInterview.interview_type)}
                </span>
                <span className="text-xs text-slate-500">
                  {activeInterview.language === "ar" ? "Arabic" : "English"} · {activeInterview.questions.length} questions
                </span>
              </div>
            </div>
          </div>

          {activeInterview.candidate_summary && (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Candidate Summary</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{activeInterview.candidate_summary}</p>
            </div>
          )}

          {activeInterview.focus_areas.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {activeInterview.focus_areas.map((area) => (
                  <span key={area} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            {activeInterview.questions.map((q) => (
              <div key={q.index} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                    {q.index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-7 text-slate-900">{q.question}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${typeBadge(q.type)}`}>
                        {q.type}
                      </span>
                      {q.focus_area && (
                        <span className="text-[11px] text-slate-500">{q.focus_area}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* History */}
      {history.length > 0 && (
        <Panel className="p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">History</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Previous interview sets</h2>

          <div className="mt-5 space-y-3">
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => void loadHistoryItem(item.id)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-950">{item.candidate_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{item.job_title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge(item.interview_type)}`}>
                      {typeLabel(item.interview_type)}
                    </span>
                    <span className="text-xs text-slate-500">{item.question_count}Q</span>
                    <span className="text-xs text-slate-400">{formatDate(item.created_at)}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
