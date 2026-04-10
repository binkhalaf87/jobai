import Link from "next/link";

import { Panel } from "@/components/panel";

const ANALYSIS_STATUS_CARDS = [
  {
    title: "Completed analyses",
    value: "0",
    note: "Saved reports will show up here when the history endpoint is added."
  },
  {
    title: "Average score",
    value: "0%",
    note: "This starter metric is ready for real aggregated score data."
  },
  {
    title: "Best recent result",
    value: "N/A",
    note: "Use this card later for standout resume-to-role matches."
  }
];

// This page is the future home for analysis history, saved result summaries, and revisit links.
export default function DashboardAnalysesPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">My Analyses</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Review saved analysis runs and revisit result pages
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          This screen is structured for practical day-to-day review work: summary metrics at the top, then a history
          list where recent analyses can be filtered, reopened, and compared.
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {ANALYSIS_STATUS_CARDS.map((card) => (
          <Panel key={card.title} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.title}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">History</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recent analysis entries</h2>
          </div>
          <Link
            href="/dashboard/new-analysis"
            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Run a new analysis
          </Link>
        </div>

        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-base font-semibold text-slate-900">No analysis records yet</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Once analysis history is connected, this list can show overall score, match score, ATS score, timestamps,
            and direct links to each saved result page.
          </p>
        </div>
      </Panel>
    </div>
  );
}
