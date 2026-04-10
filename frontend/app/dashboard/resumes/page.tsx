import Link from "next/link";

import { Panel } from "@/components/panel";
import { ResumeUploadCard } from "@/components/resume-upload-card";

// This page gives uploaded resumes a dedicated workspace separate from analysis history and settings.
export default function DashboardResumesPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">My Resumes</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Keep source resumes organized and ready for analysis
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          This area is reserved for uploaded resume records, metadata, and future version history. The upload boundary
          stays here so resume management remains independent from scoring and reporting.
        </p>
      </Panel>

      <ResumeUploadCard />

      <Panel className="p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Saved Resumes</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your uploaded files will appear here</h2>
          </div>
          <Link
            href="/dashboard/new-analysis"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Start a new analysis
          </Link>
        </div>

        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-base font-semibold text-slate-900">No saved resumes listed yet</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            A future listing API can populate file names, upload timestamps, parsing status, and links back into each
            resume preview from this section.
          </p>
        </div>
      </Panel>
    </div>
  );
}
