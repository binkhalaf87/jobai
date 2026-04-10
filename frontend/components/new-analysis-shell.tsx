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
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">New Analysis</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Set up a fresh resume-to-role comparison
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Upload a resume, save a target job description, and then open the combined results page to generate the full
          deterministic analysis report.
        </p>
      </Panel>

      <Panel className="p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Ready Check</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Run the full review when both records are ready</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The analysis page is powered by the stored IDs below, so this workflow stays clean and reusable as the
              product grows.
            </p>
          </div>
          <Link
            href={analysisHref}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              latestResumeId && latestJobDescriptionId
                ? "bg-slate-900 text-white hover:bg-slate-700"
                : "pointer-events-none border border-slate-300 bg-white text-slate-400"
            }`}
          >
            Open analysis results
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest Resume ID</p>
            <p className="mt-3 break-all font-mono text-sm text-slate-900">
              {latestResumeId || "Upload a resume to capture its record ID here."}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest Job Description ID</p>
            <p className="mt-3 break-all font-mono text-sm text-slate-900">
              {latestJobDescriptionId || "Save a job description to capture its record ID here."}
            </p>
          </div>
        </div>
      </Panel>

      <ResumeUploadCard onUploadComplete={setLatestResumeId} />
      <JobDescriptionCard onSaveComplete={setLatestJobDescriptionId} />
    </div>
  );
}
