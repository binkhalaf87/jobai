"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

type AnswerMode = "text" | "video";
type InterviewLanguage = "en" | "ar";

type InterviewAnswerComposerProps = {
  answerMode: AnswerMode;
  onAnswerModeChange: (mode: AnswerMode) => void;
  answerValue: string;
  onAnswerChange: Dispatch<SetStateAction<string>>;
  language: InterviewLanguage;
  questionKey: string;
  isSubmitting: boolean;
  error: string;
  onSubmit: () => void;
};

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

function speechLocale(language: InterviewLanguage): string {
  return language === "ar" ? "ar-SA" : "en-US";
}

export function InterviewAnswerComposer({
  answerMode,
  onAnswerModeChange,
  answerValue,
  onAnswerChange,
  language,
  questionKey,
  isSubmitting,
  error,
  onSubmit,
}: InterviewAnswerComposerProps) {
  const t = useTranslations("interview.answerComposer");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const restartRecognitionRef = useRef(false);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [cameraError, setCameraError] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  const canUseMediaDevices =
    typeof navigator !== "undefined" &&
    typeof window !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const canUseSpeechRecognition =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const transcriptHint = useMemo(() => {
    return t("interview.transcriptHint");
  }, [t]);

  function resetRecordedVideoUrl() {
    setRecordedVideoUrl((previousUrl) => {
      if (previousUrl) {
        URL.revokeObjectURL(previousUrl);
      }
      return null;
    });
  }

  function stopSpeechRecognition() {
    restartRecognitionRef.current = false;
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }

  function stopVideoCapture() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setIsRecordingVideo(false);
  }

  function stopLiveAnswer() {
    stopSpeechRecognition();
    stopVideoCapture();
  }

  async function startSpeechRecognition() {
    if (!canUseSpeechRecognition) {
      return;
    }

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      return;
    }

    if (speechRecognitionRef.current) {
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = speechLocale(language);
    restartRecognitionRef.current = true;

    recognition.onresult = (event) => {
      let nextInterimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();

        if (!transcript) {
          continue;
        }

        if (result.isFinal) {
          onAnswerChange((previousAnswer) => {
            const separator = previousAnswer.trim().length > 0 ? " " : "";
            return `${previousAnswer}${separator}${transcript}`.trim();
          });
        } else {
          nextInterimTranscript = `${nextInterimTranscript} ${transcript}`.trim();
        }
      }

      setInterimTranscript(nextInterimTranscript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      speechRecognitionRef.current = null;

      if (restartRecognitionRef.current && mediaStreamRef.current) {
        void startSpeechRecognition();
      }
    };

    recognition.start();
    speechRecognitionRef.current = recognition;
    setIsListening(true);
  }

  async function startLiveAnswer() {
    setCameraError("");
    resetRecordedVideoUrl();

    if (!canUseMediaDevices) {
      setCameraError("Camera and microphone access are not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraActive(true);

      if (typeof MediaRecorder !== "undefined") {
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        recorder.onstop = () => {
          if (recordedChunksRef.current.length === 0) {
            return;
          }

          const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "video/webm" });
          resetRecordedVideoUrl();
          setRecordedVideoUrl(URL.createObjectURL(blob));
          setIsRecordingVideo(false);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecordingVideo(true);
      }

      if (canUseSpeechRecognition) {
        await startSpeechRecognition();
      }
    } catch (mediaError) {
      stopLiveAnswer();
      setCameraError(mediaError instanceof Error ? mediaError.message : "Unable to access camera and microphone.");
    }
  }

  useEffect(() => {
    setInterimTranscript("");
    stopLiveAnswer();
    resetRecordedVideoUrl();
  }, [questionKey]);

  useEffect(() => {
    if (answerMode !== "video") {
      stopLiveAnswer();
    }
  }, [answerMode]);

  useEffect(() => {
    return () => {
      stopLiveAnswer();
      resetRecordedVideoUrl();
    };
  }, []);

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["text", "video"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onAnswerModeChange(mode)}
            className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              answerMode === mode
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
            }`}
          >
            {mode === "text" ? t("modes.text") : t("modes.video")}
          </button>
        ))}
      </div>

      {answerMode === "video" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-brand-800">
                {isCameraActive ? (
                  <video ref={videoRef} autoPlay muted playsInline className="aspect-video h-full w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-300">
                    {t("cameraPrompt")}
                  </div>
                )}
              </div>

              {recordedVideoUrl && !isCameraActive && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{t("localReplay")}</p>
                  <video controls playsInline src={recordedVideoUrl} className="w-full rounded-2xl border border-slate-200 bg-black" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${isCameraActive ? "border-teal-light bg-teal-light/30 text-teal" : "border-slate-200 bg-white text-slate-500"}`}>
                  {isCameraActive ? t("status.cameraLive") : t("status.cameraOff")}
                </span>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${isRecordingVideo ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-500"}`}>
                  {isRecordingVideo ? t("status.recording") : t("status.notRecording")}
                </span>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${isListening ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500"}`}>
                  {isListening ? t("status.transcribing") : t("status.transcriptIdle")}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={() => void startLiveAnswer()}
                    className="rounded-xl bg-brand-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >
                    {t("actions.startLiveAnswer")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopLiveAnswer}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    {t("actions.stopLiveAnswer")}
                  </button>
                )}

                {isCameraActive && canUseSpeechRecognition && !isListening && (
                  <button
                    type="button"
                    onClick={() => void startSpeechRecognition()}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    {t("actions.resumeTranscript")}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setInterimTranscript("");
                    onAnswerChange("");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                >
                  {t("actions.clearTranscript")}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                {transcriptHint}
              </div>

              {!canUseSpeechRecognition && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {t("speechUnavailable")}
                </div>
              )}

              {cameraError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {cameraError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="answer-input">
          {answerMode === "video" ? t("labels.transcriptForEvaluation") : t("labels.yourAnswer")}
        </label>
        <textarea
          id="answer-input"
          rows={answerMode === "video" ? 8 : 7}
          value={answerValue}
          onChange={(event) => onAnswerChange(event.target.value)}
          disabled={isSubmitting}
          placeholder={
            answerMode === "video"
              ? t("placeholders.video")
              : t("placeholders.text")
          }
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
        />
        {interimTranscript && (
          <p className="mt-2 text-xs text-slate-500">
            {t("liveTranscript", { transcript: interimTranscript })}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <button
        type="button"
        disabled={!answerValue.trim() || isSubmitting}
        onClick={onSubmit}
        className="rounded-xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </button>
    </div>
  );
}
