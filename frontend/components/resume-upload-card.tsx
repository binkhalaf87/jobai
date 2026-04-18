"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Panel } from "@/components/panel";
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
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [resumeId, setResumeId] = useState("");

  async function handleFile(file: File | null) {
    if (!file) {
      return;
    }

    const isAcceptedType =
      ACCEPTED_TYPES.includes(file.type) || file.name.toLowerCase().endsWith(".pdf") || file.name.toLowerCase().endsWith(".docx");

    if (!isAcceptedType) {
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
    <Panel className="p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">{t("eyebrow")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{t("title")}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{t("description")}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
        >
          {t("chooseFile")}
        </button>
      </div>

      <div
        onDragEnter={() => setIsDragging(true)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files[0] ?? null);
        }}
        className={`mt-6 rounded-3xl border border-dashed px-6 py-10 text-center transition ${
          isDragging ? "border-brand-800 bg-slate-100" : "border-slate-300 bg-slate-50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0] ?? null);
            event.currentTarget.value = "";
          }}
        />
        <p className="text-base font-semibold text-slate-900">{t("dropzone")}</p>
        <p className="mt-2 text-sm text-slate-500">{t("dropzoneHint")}</p>
      </div>

      {uploadState === "uploading" ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>{t("uploading", { filename: uploadedFileName })}</span>
            <span>{t("uploadingProgress", { progress })}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-brand-800 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}

      {uploadState === "success" ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-semibold">{t("success")}</p>
          <p className="mt-1">{t("successDetail", { filename: uploadedFileName })}</p>
          <p className="mt-1">{t("resumeId", { id: resumeId })}</p>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </Panel>
  );
}
