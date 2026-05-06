"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { getApiBaseUrl } from "@/lib/api";
import type { CandidateDetail } from "./types";

type Props = { detail: CandidateDetail };

export function CandidateDocuments({ detail }: Props) {
  const t = useTranslations("recruiter.candidateDetailPage");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!detail.file_available) return;

    setLoadingFile(true);
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem("jobai_access_token")
        : null;

    let objectUrl: string | null = null;

    fetch(`${getApiBaseUrl()}/recruiter/candidates/${detail.id}/file`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load file.");
        return r.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => setFileError("Could not load the resume file."))
      .finally(() => setLoadingFile(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail.id, detail.file_available]);

  function handlePrint() {
    if (!blobUrl) return;
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } else {
      window.open(blobUrl, "_blank");
    }
  }

  function handleOpen() {
    if (blobUrl) window.open(blobUrl, "_blank");
  }

  if (!detail.file_available) {
    if (detail.raw_text) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-amber-600">⚠</span>
            <p className="text-xs text-amber-800">{t("preview.fileNotAvailable")}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-6 text-slate-700">{detail.raw_text}</pre>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">{t("preview.notAvailableTitle")}</p>
        <p className="mt-2 text-xs text-slate-500">{t("preview.notAvailableDesc")}</p>
      </div>
    );
  }

  if (loadingFile) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          {t("preview.loading")}
        </div>
      </div>
    );
  }

  if (fileError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">{fileError}</p>
      </div>
    );
  }

  const isPdf = (detail.file_type || "").toLowerCase() === "pdf";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
            isPdf ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
          }`}>
            {(detail.file_type || "FILE").toUpperCase()}
          </span>
          {detail.source_filename && (
            <span className="max-w-[200px] truncate text-xs text-slate-500">{detail.source_filename}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleOpen} disabled={!blobUrl}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40">
            {t("preview.open")}
          </button>
          {isPdf && (
            <button type="button" onClick={handlePrint} disabled={!blobUrl}
              className="rounded-xl bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40">
              {t("preview.print")}
            </button>
          )}
          {!isPdf && blobUrl && (
            <a href={blobUrl} download={detail.source_filename ?? `resume.${detail.file_type}`}
              className="rounded-xl bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700">
              {t("preview.download")}
            </a>
          )}
        </div>
      </div>

      {isPdf && blobUrl ? (
        <iframe ref={iframeRef} src={blobUrl} title="Resume Preview"
          className="h-[75vh] w-full rounded-2xl border border-slate-200 bg-white" />
      ) : !isPdf && blobUrl ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">{t("preview.wordDoc")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("preview.wordDocDesc")}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
