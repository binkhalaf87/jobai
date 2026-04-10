import Link from "next/link";

import { Panel } from "@/components/panel";

// Analysis hub: entry point for running new analyses and reviewing history.
export default function DashboardAnalysisPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Analysis</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Match your resume to any job description
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Upload a resume, paste a job description, and get a detailed ATS compatibility score, keyword gap report,
          and overall fit rating in seconds.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/new-analysis"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Run new analysis
          </Link>
          <Link
            href="/dashboard/analyses"
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            View history
          </Link>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total analyses", value: "0", note: "Analyses will appear here once you run your first one." },
          { label: "Average score", value: "—", note: "Your average fit score across all saved analyses." },
          { label: "Best match", value: "—", note: "The highest-scoring resume-to-role pair you have run." },
        ].map((card) => (
          <Panel key={card.label} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recent Analyses</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your analysis history</h2>
        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-base font-semibold text-slate-900">No analysis records yet</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Past analyses will appear here with their scores, timestamps, and direct links back into each result.
          </p>
          <Link
            href="/dashboard/new-analysis"
            className="mt-5 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Start your first analysis
          </Link>
        </div>
      </Panel>
    </div>
  );
}
