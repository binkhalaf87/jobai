"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Panel } from "@/components/panel";
import { api, ApiError } from "@/lib/api";

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
  response_status: string;
  invite_sent_at: string | null;
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
  response_status: string;
  invite_sent_at: string | null;
  created_at: string;
};

type QuestionFeedback = {
  index: number;
  score: number;
  feedback: string;
  strength: string;
  weakness: string;
};

type ResponseItem = {
  question_index: number;
  question_text: string;
  text_answer: string | null;
  has_video: boolean;
  video_data: string | null;
  submitted_at: string;
};

type ResponsesResult = {
  interview_id: string;
  candidate_name: string;
  job_title: string;
  overall_score: number | null;
  overall_impression: string | null;
  hire_recommendation: string | null;
  per_question: QuestionFeedback[];
  responses: ResponseItem[];
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

function responseStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    sent: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-teal-100 text-teal-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-500";
}

function responseStatusLabel(status: string) {
  const map: Record<string, string> = {
    pending: "Not Sent",
    sent: "Invite Sent",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return map[status] ?? status;
}

function hireBadge(rec: string) {
  const map: Record<string, string> = {
    strong_yes: "bg-teal-100 text-teal-700",
    yes: "bg-green-100 text-green-700",
    maybe: "bg-amber-100 text-amber-700",
    no: "bg-rose-100 text-rose-700",
  };
  return map[rec] ?? "bg-slate-100 text-slate-600";
}

function hireLabel(rec: string) {
  const map: Record<string, string> = {
    strong_yes: "Strong Yes",
    yes: "Yes",
    maybe: "Maybe",
    no: "No",
  };
  return map[rec] ?? rec;
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

  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [loadingResponses, setLoadingResponses] = useState(false);
  const [responses, setResponses] = useState<ResponsesResult | null>(null);

  useEffect(() => {
    async function loadSetup() {
      try {
        const [jobsData, allCandidates, historyData] = await Promise.all([
          api.get<Job[]>("/recruiter/jobs/", { auth: true }),
          api.get<Candidate[]>("/recruiter/candidates/", { auth: true }),
          api.get<InterviewListItem[]>("/recruiter/interviews/", { auth: true }),
        ]);
        setJobs(jobsData);
        // Filter to interview-stage candidates only
        const interviewCandidates = allCandidates.filter((c) => c.stage === "interview");
        setCandidates(interviewCandidates);
        setHistory(historyData);
        if (jobsData.length > 0) setSelectedJobId(jobsData[0].id);
        if (interviewCandidates.length > 0) setSelectedCandidateId(interviewCandidates[0].id);
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
    setSendSuccess(null);
    setSendError(null);
    setResponses(null);
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
    setSendSuccess(null);
    setSendError(null);
    setResponses(null);
    try {
      const data = await api.get<GeneratedInterview>(`/recruiter/interviews/${id}`, { auth: true });
      setActiveInterview(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Failed to load interview.");
    }
  }

  async function sendInvite(interviewId: string) {
    setSending(true);
    setSendSuccess(null);
    setSendError(null);
    try {
      const res = await api.post<{ message: string; candidate_email: string }>(
        `/recruiter/interviews/${interviewId}/send-invite`,
        {},
        { auth: true }
      );
      setSendSuccess(`Invite sent to ${res.candidate_email}`);
      // Refresh history and active interview
      const [updated, refreshed] = await Promise.all([
        api.get<InterviewListItem[]>("/recruiter/interviews/", { auth: true }),
        api.get<GeneratedInterview>(`/recruiter/interviews/${interviewId}`, { auth: true }),
      ]);
      setHistory(updated);
      setActiveInterview(refreshed);
    } catch (e) {
      setSendError(e instanceof ApiError ? e.detail : "Failed to send invite. Check your SMTP settings.");
    } finally {
      setSending(false);
    }
  }

  async function viewResponses(interviewId: string) {
    setLoadingResponses(true);
    setResponses(null);
    try {
      const data = await api.get<ResponsesResult>(
        `/recruiter/interviews/${interviewId}/responses`,
        { auth: true }
      );
      setResponses(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Failed to load responses.");
    } finally {
      setLoadingResponses(false);
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

  const noInterviewCandidates = candidates.length === 0;
  const noJobs = jobs.length === 0;

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Panel className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI Interview</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          Generate & send interview questions
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Shows only candidates you've moved to the <strong>Interview</strong> stage. Generate
          tailored questions and send a video interview link directly to the candidate's email.
        </p>

        {noJobs || noInterviewCandidates ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-900">
              {noJobs ? "No jobs found" : "No candidates in Interview stage"}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {noJobs
                ? "Add at least one job before generating interview questions."
                : "Move candidates to the Interview stage from the Candidates page first."}
            </p>
            <Link
              href={noJobs ? "/recruiter/jobs" : "/recruiter/candidates"}
              className="mt-4 inline-flex rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {noJobs ? "Add a job" : "Go to Candidates"}
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Candidate (Interview Stage)</label>
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
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge(activeInterview.interview_type)}`}>
                  {typeLabel(activeInterview.interview_type)}
                </span>
                <span className="text-xs text-slate-500">
                  {activeInterview.language === "ar" ? "Arabic" : "English"} · {activeInterview.questions.length} questions
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${responseStatusBadge(activeInterview.response_status)}`}>
                  {responseStatusLabel(activeInterview.response_status)}
                </span>
                {activeInterview.invite_sent_at && (
                  <span className="text-xs text-slate-400">Sent {formatDate(activeInterview.invite_sent_at)}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeInterview.response_status === "completed" ? (
                <button
                  type="button"
                  onClick={() => void viewResponses(activeInterview.id)}
                  disabled={loadingResponses}
                  className="rounded-2xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-500 disabled:opacity-50"
                >
                  {loadingResponses ? "Loading…" : "View Responses"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void sendInvite(activeInterview.id)}
                  disabled={sending}
                  className="rounded-2xl bg-brand-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {sending
                    ? "Sending…"
                    : activeInterview.response_status === "sent" || activeInterview.response_status === "in_progress"
                    ? "Resend Invite"
                    : "Send to Candidate"}
                </button>
              )}
            </div>
          </div>

          {sendSuccess && (
            <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
              {sendSuccess}
            </div>
          )}
          {sendError && (
            sendError.toLowerCase().includes("smtp") || sendError.toLowerCase().includes("smart send") ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-2">
                <p className="text-sm font-semibold text-amber-800">Gmail connection not set up</p>
                <p className="text-xs text-amber-700">
                  You need to connect and verify a Gmail account before sending interview invites.
                </p>
                <Link
                  href="/recruiter/profile?tab=send-settings"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  Set up Send Settings →
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {sendError}
              </div>
            )
          )}

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

      {/* Candidate Responses */}
      {responses && (
        <Panel className="p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Candidate Responses</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                {responses.candidate_name}
                <span className="font-normal text-slate-500"> — </span>
                {responses.job_title}
              </h2>
            </div>
            {responses.overall_score !== null && (
              <div className="flex flex-col items-end">
                <span className="text-3xl font-bold text-slate-900">{responses.overall_score}<span className="text-lg font-normal text-slate-400">/100</span></span>
                {responses.hire_recommendation && (
                  <span className={`mt-1 rounded-full px-3 py-0.5 text-xs font-semibold ${hireBadge(responses.hire_recommendation)}`}>
                    {hireLabel(responses.hire_recommendation)}
                  </span>
                )}
              </div>
            )}
          </div>

          {responses.overall_impression && (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Overall Impression</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{responses.overall_impression}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {responses.responses.map((resp) => {
              const feedback = responses.per_question.find((pq) => pq.index === resp.question_index);
              return (
                <div key={resp.question_index} className="rounded-3xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                      {resp.question_index + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-800">{resp.question_text}</p>
                  </div>

                  {resp.has_video && resp.video_data && (
                    <div className="mb-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Video Answer</p>
                      <video
                        controls
                        playsInline
                        src={`data:video/webm;base64,${resp.video_data}`}
                        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-black"
                      />
                    </div>
                  )}

                  {resp.text_answer && (
                    <div className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">Text Answer</p>
                      <p className="text-sm leading-7 text-slate-700">{resp.text_answer}</p>
                    </div>
                  )}

                  {feedback && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">GPT Assessment</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {feedback.score}/100
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{feedback.feedback}</p>
                      <div className="flex flex-wrap gap-3">
                        {feedback.strength && (
                          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs text-teal-700">
                            + {feedback.strength}
                          </span>
                        )}
                        {feedback.weakness && (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700">
                            − {feedback.weakness}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge(item.interview_type)}`}>
                      {typeLabel(item.interview_type)}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${responseStatusBadge(item.response_status)}`}>
                      {responseStatusLabel(item.response_status)}
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
