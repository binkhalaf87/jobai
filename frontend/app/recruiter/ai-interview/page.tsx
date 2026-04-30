"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

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

function responseStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-slate-100 text-slate-600",
    sent: "bg-amber-100 text-amber-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-teal-100 text-teal-700",
  };
  return map[status] ?? "bg-slate-100 text-slate-500";
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

export default function AIInterviewPage() {
  const t = useTranslations("recruiter.aiInterviewPage");

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
  const [generatingLink, setGeneratingLink] = useState(false);

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
        setCandidates(allCandidates);
        setHistory(historyData);
        if (jobsData.length > 0) setSelectedJobId(jobsData[0].id);
        if (allCandidates.length > 0) setSelectedCandidateId(allCandidates[0].id);
      } catch {
        setError(t("error.failedToLoad"));
      } finally {
        setLoadingSetup(false);
      }
    }
    void loadSetup();
  }, [t]);

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
      setError(t("error.failedToGenerate"));
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
      setError(t("error.failedToLoadInterview"));
    }
  }

  async function sendWhatsApp(interviewId: string) {
    setGeneratingLink(true);
    setSendError(null);
    try {
      const res = await api.post<{
        link: string; candidate_name: string; job_title: string; language: string;
      }>(`/recruiter/interviews/${interviewId}/link`, {}, { auth: true });

      const isAr = res.language === "ar";
      const msg = isAr
        ? `مرحباً ${res.candidate_name}،\n\nتمت دعوتك لإجراء مقابلة فيديو ذكية لوظيفة: ${res.job_title}\n\nيرجى الضغط على الرابط للبدء:\n${res.link}`
        : `Hi ${res.candidate_name},\n\nYou've been invited for an AI video interview for: ${res.job_title}\n\nClick the link to start:\n${res.link}`;

      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");

      const [updated, refreshed] = await Promise.all([
        api.get<InterviewListItem[]>("/recruiter/interviews/", { auth: true }),
        api.get<GeneratedInterview>(`/recruiter/interviews/${interviewId}`, { auth: true }),
      ]);
      setHistory(updated);
      setActiveInterview(refreshed);
    } catch (e) {
      setSendError(e instanceof ApiError ? e.detail : t("error.failedToSendInvite"));
    } finally {
      setGeneratingLink(false);
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
      setSendSuccess(t("inviteSent", { email: res.candidate_email }));
      // Refresh history and active interview
      const [updated, refreshed] = await Promise.all([
        api.get<InterviewListItem[]>("/recruiter/interviews/", { auth: true }),
        api.get<GeneratedInterview>(`/recruiter/interviews/${interviewId}`, { auth: true }),
      ]);
      setHistory(updated);
      setActiveInterview(refreshed);
    } catch (e) {
      setSendError(e instanceof ApiError ? e.detail : t("error.failedToSendInvite"));
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
      setError(t("error.failedToLoadResponses"));
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

  const noCandidates = candidates.length === 0;
  const noJobs = jobs.length === 0;

  return (
    <div className="space-y-6">
      {/* Generator */}
      <Panel className="p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("eyebrow")}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
          {t("title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t("desc")}
        </p>

        {noJobs || noCandidates ? (
          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-900">
              {noJobs ? t("noJobs.title") : t("noCandidates.title")}
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {noJobs ? t("noJobs.desc") : t("noCandidates.desc")}
            </p>
            <Link
              href={noJobs ? "/recruiter/jobs" : "/recruiter/candidates"}
              className="mt-4 inline-flex rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {noJobs ? t("noJobs.action") : t("noCandidates.action")}
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("form.candidateLabel")}</label>
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("form.jobLabel")}</label>
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("form.typeLabel")}</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as "hr" | "technical" | "mixed")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="mixed">{t("form.typeOptions.mixed")}</option>
                  <option value="hr">{t("form.typeOptions.hr")}</option>
                  <option value="technical">{t("form.typeOptions.technical")}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">{t("form.languageLabel")}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "en" | "ar")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="en">{t("form.languageOptions.en")}</option>
                  <option value="ar">{t("form.languageOptions.ar")}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                  {t("form.questionsLabel", { count: questionCount })}
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
                {generating ? t("form.generating") : t("form.generateBtn")}
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("generated.eyebrow")}</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
                {activeInterview.candidate_name}
                <span className="font-normal text-slate-500"> {t("generated.for")} </span>
                {activeInterview.job_title}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge(activeInterview.interview_type)}`}>
                  {t(`typeLabels.${activeInterview.interview_type}`)}
                </span>
                <span className="text-xs text-slate-500">
                  {activeInterview.language === "ar" ? t("generated.languageAr") : t("generated.languageEn")} · {t("generated.questions", { count: activeInterview.questions.length })}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${responseStatusBadge(activeInterview.response_status)}`}>
                  {t(`responseStatus.${activeInterview.response_status}`)}
                </span>
                {activeInterview.invite_sent_at && (
                  <span className="text-xs text-slate-400">{t("generated.sentDate", { date: formatDate(activeInterview.invite_sent_at) })}</span>
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
                  {loadingResponses ? t("generated.loading") : t("generated.viewResponses")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => void sendWhatsApp(activeInterview.id)}
                    disabled={generatingLink}
                    className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1ebe5d] disabled:opacity-50"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {generatingLink ? t("generated.generatingLink") : t("generated.sendWhatsApp")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendInvite(activeInterview.id)}
                    disabled={sending}
                    className="rounded-2xl bg-brand-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                  >
                    {sending
                      ? t("generated.sending")
                      : activeInterview.response_status === "sent" || activeInterview.response_status === "in_progress"
                      ? t("generated.resendInvite")
                      : t("generated.sendToCandidate")}
                  </button>
                </>
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
                <p className="text-sm font-semibold text-amber-800">{t("smtpError.title")}</p>
                <p className="text-xs text-amber-700">
                  {t("smtpError.desc")}
                </p>
                <Link
                  href="/recruiter/profile?tab=send-settings"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  {t("smtpError.action")}
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("candidateSummary")}</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{activeInterview.candidate_summary}</p>
            </div>
          )}

          {activeInterview.focus_areas.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("focusAreas")}</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("responses.eyebrow")}</p>
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
                    {t(`hireLabels.${responses.hire_recommendation}`)}
                  </span>
                )}
              </div>
            )}
          </div>

          {responses.overall_impression && (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t("responses.overallImpression")}</p>
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
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{t("responses.videoAnswer")}</p>
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
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">{t("responses.textAnswer")}</p>
                      <p className="text-sm leading-7 text-slate-700">{resp.text_answer}</p>
                    </div>
                  )}

                  {feedback && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{t("responses.gptAssessment")}</p>
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t("history.eyebrow")}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">{t("history.title")}</h2>

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
                      {t(`typeLabels.${item.interview_type}`)}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${responseStatusBadge(item.response_status)}`}>
                      {t(`responseStatus.${item.response_status}`)}
                    </span>
                    <span className="text-xs text-slate-500">{t("history.questionsCount", { count: item.question_count })}</span>
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
