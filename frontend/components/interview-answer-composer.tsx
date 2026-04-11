"use client";

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
    if (language === "ar") {
      return "يمكنك تعديل النص قبل الإرسال. التقييم يعتمد على النص النهائي وليس الفيديو نفسه.";
    }
    return "You can edit the transcript before submitting. AI evaluation uses the final text, not the raw video.";
  }, [language]);

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
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
            }`}
          >
            {mode === "text" ? "Text Answer" : "Video + Voice"}
          </button>
        ))}
      </div>

      {answerMode === "video" && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
            <div className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                {isCameraActive ? (
                  <video ref={videoRef} autoPlay muted playsInline className="aspect-video h-full w-full object-cover" />
                ) : (
                  <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-300">
                    Start live answer to enable your camera and microphone.
                  </div>
                )}
              </div>

              {recordedVideoUrl && !isCameraActive && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Local Replay</p>
                  <video controls playsInline src={recordedVideoUrl} className="w-full rounded-2xl border border-slate-200 bg-black" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${isCameraActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"}`}>
                  {isCameraActive ? "Camera live" : "Camera off"}
                </span>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${isRecordingVideo ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500"}`}>
                  {isRecordingVideo ? "Recording" : "Not recording"}
                </span>
                <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${isListening ? "border-amber-200 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500"}`}>
                  {isListening ? "Transcribing" : "Transcript idle"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {!isCameraActive ? (
                  <button
                    type="button"
                    onClick={() => void startLiveAnswer()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    Start Live Answer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopLiveAnswer}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    Stop Live Answer
                  </button>
                )}

                {isCameraActive && canUseSpeechRecognition && !isListening && (
                  <button
                    type="button"
                    onClick={() => void startSpeechRecognition()}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
                  >
                    Resume Transcript
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
                  Clear Transcript
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                {transcriptHint}
              </div>

              {!canUseSpeechRecognition && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Browser speech-to-text is not available here. You can still practice with camera and microphone, then edit the answer text manually below.
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
          {answerMode === "video" ? "Transcript for AI Evaluation" : "Your Answer"}
        </label>
        <textarea
          id="answer-input"
          rows={answerMode === "video" ? 8 : 7}
          value={answerValue}
          onChange={(event) => onAnswerChange(event.target.value)}
          disabled={isSubmitting}
          placeholder={
            answerMode === "video"
              ? "Your live transcript will appear here. You can also edit it manually before submission."
              : "Answer naturally, but be specific. Use STAR, numbers, and your exact contribution when possible."
          }
          className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-500 focus:outline-none disabled:opacity-60"
        />
        {interimTranscript && (
          <p className="mt-2 text-xs text-slate-500">
            Live transcript: <span className="italic">{interimTranscript}</span>
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
        className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Evaluating answer..." : "Submit Answer"}
      </button>
    </div>
  );
}
