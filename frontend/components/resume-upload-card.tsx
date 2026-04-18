"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { uploadResume } from "@/lib/resumes";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

type UploadState = "idle" | "uploading" | "success";

type ResumeUploadCardProps = {
  onUploadComplete?: (resumeId: string) => void;
};

export function ResumeUploadCard({ onUploadComplete }: ResumeUploadCardProps) {
  const t = useTranslations("resumes.upload");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging]       = useState(false);
  const [progress, setProgress]           = useState(0);
  const [uploadState, setUploadState]     = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage]   = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [resumeId, setResumeId]           = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;

    const isAccepted =
      ACCEPTED_TYPES.includes(file.type) ||
      file.name.toLowerCase().endsWith(".pdf") ||
      file.name.toLowerCase().endsWith(".docx");

    if (!isAccepted) {
      setErrorMessage(t("errorType"));
      setUploadState("idle");
      setProgress(0);
      return;
    }

    setErrorMessage("");
    setUploadState("uploading");
    setProgress(0);
    setUploadedFileName(file.name);
    setResumeId("");

    try {
      const response = await uploadResume(file, setProgress);
      setResumeId(response.resume_id);
      onUploadComplete?.(response.resume_id);
      setUploadState("success");
      setProgress(100);
    } catch (error) {
      setUploadState("idle");
      setProgress(0);
      setErrorMessage(error instanceof Error ? error.message : t("errorGeneric"));
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-brand-100 bg-gradient-to-br from-brand-800/5 via-white to-teal/3">
      {/* Header */}
      <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">{t("eyebrow")}</p>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">{t("title")}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadState === "uploading"}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-800/20 transition hover:bg-brand-700 disabled:opacity-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          </svg>
          {t("chooseFile")}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); void handleFile(e.dataTransfer.files[0] ?? null); }}
        onClick={() => inputRef.current?.click()}
        className={[
          "mx-6 mb-6 cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all",
          isDragging
            ? "border-brand-500 bg-brand-50 shadow-inner"
            : "border-slate-200 bg-slate-50/60 hover:border-brand-300 hover:bg-brand-50/40",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => { void handleFile(e.target.files?.[0] ?? null); e.currentTarget.value = ""; }}
        />
        <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${isDragging ? "bg-brand-800 text-white" : "bg-slate-100 text-slate-400"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-800">{t("dropzone")}</p>
        <p className="mt-1 text-xs text-slate-500">{t("dropzoneHint")}</p>
      </div>

      {/* Progress */}
      {uploadState === "uploading" && (
        <div className="mx-6 mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-700" />
              {t("uploading", { filename: uploadedFileName })}
            </span>
            <span className="font-semibold text-brand-800">{t("uploadingProgress", { progress })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-800 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Success */}
      {uploadState === "success" && (
        <div className="mx-6 mb-6 flex items-start gap-3 rounded-2xl border border-teal-light bg-teal-light/20 px-4 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div className="text-sm">
            <p className="font-bold text-teal">{t("success")}</p>
            <p className="mt-0.5 text-teal/80">{t("successDetail", { filename: uploadedFileName })}</p>
            <p className="mt-0.5 font-mono text-[10px] text-teal/60">{t("resumeId", { id: resumeId })}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="mx-6 mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-rose-700">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
