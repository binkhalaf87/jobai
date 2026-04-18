"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { JobDescriptionCard } from "@/components/job-description-card";
import { Panel } from "@/components/panel";
import { ResumeUploadCard } from "@/components/resume-upload-card";

// This workspace keeps the new-analysis flow focused without mixing it into the overview page.
export function NewAnalysisShell() {
  const [latestResumeId, setLatestResumeId] = useState("");
  const [latestJobDescriptionId, setLatestJobDescriptionId] = useState("");

  const analysisHref = useMemo(() => {
    if (!latestResumeId || !latestJobDescriptionId) {
      return "/dashboard/results";
    }

    return `/dashboard/results?resumeId=${encodeURIComponent(latestResumeId)}&jobDescriptionId=${encodeURIComponent(latestJobDescriptionId)}`;
  }, [latestJobDescriptionId, latestResumeId]);

  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">New Check</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Compare a CV with a role
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Upload a CV, add a job description, then run the result.
        </p>
      </Panel>

      <Panel className="p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Ready</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Run when both items are ready</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Once both are saved, open the result and continue to improve or apply.
            </p>
          </div>
          <Link
            href={analysisHref}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              latestResumeId && latestJobDescriptionId
                ? "bg-brand-800 text-white hover:bg-brand-700"
                : "pointer-events-none border border-slate-300 bg-white text-slate-400"
            }`}
          >
            Open result
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest CV ID</p>
            <p className="mt-3 break-all font-mono text-sm text-slate-900">
              {latestResumeId || "Upload a CV to continue."}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest Job ID</p>
            <p className="mt-3 break-all font-mono text-sm text-slate-900">
              {latestJobDescriptionId || "Save a job description to continue."}
            </p>
          </div>
        </div>
      </Panel>

      <ResumeUploadCard onUploadComplete={setLatestResumeId} />
      <JobDescriptionCard onSaveComplete={setLatestJobDescriptionId} />
    </div>
  );
}
