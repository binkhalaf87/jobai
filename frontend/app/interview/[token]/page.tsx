"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type PublicQuestion = {
  index: number;
  question: string;
  type: string;
  focus_area: string | null;
};

type InterviewInfo = {
  interview_id: string;
  candidate_name: string;
  job_title: string;
  company_name: string | null;
  interview_type: string;
  language: string;
  questions: PublicQuestion[];
  already_completed: boolean;
};

type AnswerResult = {
  saved: boolean;
  questions_answered: number;
  total_questions: number;
  completed: boolean;
};

export default function CandidateInterviewPage({ params }: { params: { token: string } }) {
  const [info, setInfo] = useState<InterviewInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Camera/recording state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [cameraError, setCameraError] = useState("");

  const isArabic = info?.language === "ar";

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<InterviewInfo>(`/interview/token/${params.token}`);
        setInfo(data);
        if (data.already_completed) setCompleted(true);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "This interview link is invalid or has expired.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [params.token]);

  // Cleanup camera on question change
  useEffect(() => {
    stopCamera();
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    setTextAnswer("");
    setSubmitError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopCamera() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setIsRecording(false);
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      mediaStreamRef.current = stream;
      chunksRef.current = [];
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraActive(true);

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setIsRecording(false);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : "Unable to access camera.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  }

  async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function submitAnswer() {
    if (!info) return;
    const q = info.questions[currentIndex];
    if (!recordedBlob && !textAnswer.trim()) {
      setSubmitError(isArabic ? "يرجى تسجيل إجابة أو كتابتها." : "Please record a video or type your answer.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      let video_data: string | null = null;
      if (recordedBlob) video_data = await blobToBase64(recordedBlob);

      const result = await api.post<AnswerResult>(`/interview/token/${params.token}/answer`, {
        question_index: q.index,
        question_text: q.question,
        video_data,
        text_answer: textAnswer.trim() || null,
      });

      if (result.completed) {
        setCompleted(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-2xl">!</div>
          <h1 className="text-xl font-semibold text-slate-900">Link Error</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (completed || info?.already_completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6" dir={isArabic ? "rtl" : "ltr"}>
        <div className="max-w-md rounded-3xl border border-teal-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100 text-teal-600 text-3xl">✓</div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {isArabic ? "شكراً لك!" : "Interview Complete!"}
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {isArabic
              ? "تم تسجيل إجاباتك بنجاح. سيتواصل معك فريق التوظيف قريباً."
              : "Your answers have been submitted. The hiring team will review them and be in touch soon."}
          </p>
        </div>
      </div>
    );
  }

  if (!info) return null;

  const q = info.questions[currentIndex];
  const total = info.questions.length;
  const progress = Math.round(((currentIndex) / total) * 100);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isArabic ? "مقابلة فيديو ذكية" : "AI Video Interview"}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{info.job_title}</h1>
          {info.company_name && <p className="mt-0.5 text-sm text-slate-500">{info.company_name}</p>}
          <p className="mt-2 text-sm text-slate-600">
            {isArabic ? `مرحباً ${info.candidate_name}` : `Hi ${info.candidate_name}`}
          </p>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
              <span>{isArabic ? `سؤال ${currentIndex + 1} من ${total}` : `Question ${currentIndex + 1} of ${total}`}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-800 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              {q.index + 1}
            </span>
            <div>
              <p className="text-base font-medium leading-7 text-slate-900">{q.question}</p>
              {q.focus_area && (
                <p className="mt-1.5 text-xs text-slate-500">{q.focus_area}</p>
              )}
            </div>
          </div>
        </div>

        {/* Recording area */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-slate-700">
            {isArabic ? "سجّل إجابتك بالفيديو" : "Record your video answer"}
          </p>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
            {isCameraActive ? (
              <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
            ) : recordedUrl ? (
              <video controls playsInline src={recordedUrl} className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-slate-400">
                {isArabic ? "انقر لتشغيل الكاميرا" : "Click below to start recording"}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!isCameraActive && !recordedUrl && (
              <button
                type="button"
                onClick={() => void startCamera()}
                className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {isArabic ? "ابدأ التسجيل" : "Start Recording"}
              </button>
            )}
            {isCameraActive && (
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                {isArabic ? "أوقف التسجيل" : "Stop Recording"}
              </button>
            )}
            {recordedUrl && !isCameraActive && (
              <button
                type="button"
                onClick={() => {
                  setRecordedBlob(null);
                  if (recordedUrl) URL.revokeObjectURL(recordedUrl);
                  setRecordedUrl(null);
                  chunksRef.current = [];
                }}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
              >
                {isArabic ? "إعادة التسجيل" : "Re-record"}
              </button>
            )}
          </div>

          {cameraError && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
              {cameraError}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {isArabic ? "إجابة نصية (اختياري)" : "Text answer (optional)"}
            </label>
            <textarea
              rows={4}
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder={isArabic ? "اكتب إجابتك هنا..." : "Type your answer here..."}
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
            />
          </div>

          {submitError && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void submitAnswer()}
            disabled={submitting || (!recordedBlob && !textAnswer.trim())}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {submitting
              ? (isArabic ? "جارٍ الإرسال..." : "Submitting...")
              : currentIndex < total - 1
              ? (isArabic ? "إرسال والانتقال للسؤال التالي" : "Submit & Next Question")
              : (isArabic ? "إرسال وإنهاء المقابلة" : "Submit & Complete Interview")}
          </button>
        </div>
      </div>
    </div>
  );
}
