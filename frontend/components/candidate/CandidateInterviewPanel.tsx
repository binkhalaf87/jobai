"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import type { CandidateInterview, InterviewDetail, InterviewResponses } from "./types";

type Props = { candidateId: string };

export function CandidateInterviewPanel({ candidateId }: Props) {
  const [interviews, setInterviews] = useState<CandidateInterview[]>([]);
  const [selected, setSelected] = useState<InterviewDetail | null>(null);
  const [responses, setResponses] = useState<InterviewResponses | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [waLink, setWaLink] = useState<string | null>(null);

  useEffect(() => {
    api.get<CandidateInterview[]>("/recruiter/interviews/", { auth: true })
      .then((all) => {
        const mine = all.filter((iv) => iv.resume_id === candidateId);
        setInterviews(mine);
        if (mine.length > 0) void loadDetail(mine[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  async function loadDetail(id: string) {
    try {
      const iv = await api.get<InterviewDetail>(`/recruiter/interviews/${id}`, { auth: true });
      setSelected(iv);
      setResponses(null);
      if (iv.response_status === "completed") {
        const r = await api.get<InterviewResponses>(`/recruiter/interviews/${id}/responses`, { auth: true });
        setResponses(r);
      }
    } catch { /* ignore */ }
  }

  async function handleWhatsApp(interviewId: string) {
    setGeneratingLink(true);
    try {
      const res = await api.post<{ link: string; candidate_name: string; job_title: string; language: string }>(
        `/recruiter/interviews/${interviewId}/link`, {}, { auth: true }
      );
      const isAr = res.language === "ar";
      const msg = isAr
        ? `مرحباً ${res.candidate_name}،\n\nتمت دعوتك لإجراء مقابلة فيديو ذكية لوظيفة: ${res.job_title}\n\nيرجى الضغط على الرابط للبدء:\n${res.link}`
        : `Hi ${res.candidate_name},\n\nYou've been invited for an AI video interview for: ${res.job_title}\n\nClick the link to start:\n${res.link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
      setWaLink(res.link);
    } catch { /* ignore */ } finally {
      setGeneratingLink(false);
    }
  }

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />;

  if (interviews.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">No interviews yet</p>
        <p className="mt-1 text-xs text-slate-500">Go to the AI Interview page to generate questions for this candidate.</p>
        <Link href="/recruiter/ai-interview"
          className="mt-4 inline-block rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700">
          Go to AI Interview →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interviews.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {interviews.map((iv) => (
            <button key={iv.id} type="button"
              onClick={() => void loadDetail(iv.id)}
              className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                selected?.id === iv.id
                  ? "border-brand-800 bg-brand-50 text-brand-800"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {iv.job_title}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {selected.interview_type.toUpperCase()} · {selected.question_count} questions
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{selected.job_title}</p>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                selected.response_status === "completed" ? "bg-teal-100 text-teal-700" :
                selected.response_status === "in_progress" ? "bg-blue-100 text-blue-700" :
                selected.response_status === "sent" ? "bg-amber-100 text-amber-700" :
                "bg-slate-100 text-slate-600"
              }`}>{selected.response_status}</span>
            </div>
            {selected.response_status !== "completed" && (
              <button type="button" onClick={() => void handleWhatsApp(selected.id)} disabled={generatingLink}
                className="flex items-center gap-2 rounded-2xl bg-[#25D366] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1ebe5d] disabled:opacity-50">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                {generatingLink ? "Generating…" : "Send via WhatsApp"}
              </button>
            )}
          </div>

          {waLink && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs text-teal-700">
              Interview link: <span className="font-mono break-all">{waLink}</span>
            </div>
          )}

          {responses && (
            <div className="space-y-4">
              {responses.overall_score !== null && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <p className="text-sm font-semibold text-slate-700">Overall Score</p>
                  <span className={`text-2xl font-bold tabular-nums ${
                    responses.overall_score >= 70 ? "text-emerald-700" :
                    responses.overall_score >= 40 ? "text-amber-700" : "text-rose-600"
                  }`}>{responses.overall_score}/100</span>
                </div>
              )}
              {responses.overall_impression && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2">Overall Impression</p>
                  <p className="text-sm leading-6 text-slate-700">{responses.overall_impression}</p>
                </div>
              )}
              <div className="space-y-3">
                {responses.responses.map((resp) => {
                  const fb = responses.per_question.find((pq) => pq.index === resp.question_index);
                  return (
                    <div key={resp.question_index} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 flex-shrink-0">
                          {resp.question_index + 1}
                        </span>
                        <p className="text-sm font-medium text-slate-800">{resp.question_text}</p>
                      </div>
                      {resp.text_answer && (
                        <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-xs leading-6 text-slate-700">{resp.text_answer}</p>
                        </div>
                      )}
                      {fb && (
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <div className="flex flex-wrap gap-2">
                            {fb.strength && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">✓ {fb.strength}</span>}
                            {fb.weakness && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">✕ {fb.weakness}</span>}
                          </div>
                          <span className={`font-bold tabular-nums ${fb.score >= 7 ? "text-emerald-700" : fb.score >= 5 ? "text-amber-700" : "text-rose-600"}`}>
                            {fb.score}/10
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!responses && selected.questions && selected.questions.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Interview Questions</p>
              {selected.questions.map((q) => (
                <div key={q.index} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 flex-shrink-0">
                      {q.index + 1}
                    </span>
                    <div>
                      <p className="text-sm leading-6 text-slate-900">{q.question}</p>
                      {q.focus_area && <p className="mt-1 text-xs text-slate-400">{q.focus_area}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
