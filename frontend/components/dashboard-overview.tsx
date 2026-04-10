import Link from "next/link";

import { Panel } from "@/components/panel";

const OVERVIEW_METRICS = [
  {
    label: "Total analyses",
    value: "0",
    note: "Analyses will appear here once full runs are saved."
  },
  {
    label: "Average score",
    value: "0%",
    note: "This average will update as analysis history grows."
  },
  {
    label: "Latest activity",
    value: "No runs yet",
    note: "Start a new analysis to populate your dashboard timeline."
  }
];

const QUICK_ACTIONS = [
  {
    label: "New Analysis",
    href: "/dashboard/new-analysis",
    description: "Upload a resume and pair it with a target role."
  },
  {
    label: "My Resumes",
    href: "/dashboard/resumes",
    description: "Manage uploaded resumes and keep source files organized."
  },
  {
    label: "My Analyses",
    href: "/dashboard/analyses",
    description: "Review completed analysis runs and revisit result pages."
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    description: "Adjust profile and account preferences."
  }
];

// This overview screen gives the dashboard a practical empty-state home before analytics APIs are added.
export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Dashboard Overview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          A clean control center for your resume workflow
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          This overview is designed for day-to-day use: quick actions are up front, the headline metrics are easy to
          scan, and recent analysis activity has a clear place to live once the history API is connected.
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {OVERVIEW_METRICS.map((metric) => (
          <Panel key={metric.label} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{metric.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{metric.note}</p>
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Latest Analyses</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recent runs will show up here</h2>
            </div>
            <Link
              href="/dashboard/analyses"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              View all analyses
            </Link>
          </div>

          <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
            <p className="text-base font-semibold text-slate-900">No analysis history yet</p>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Once users begin running analyses, this section is ready to show recent scores, timestamps, and direct
              links back into each result page.
            </p>
            <Link
              href="/dashboard/new-analysis"
              className="mt-5 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Start your first analysis
            </Link>
          </div>
        </Panel>

        <Panel className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Quick Actions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Jump to the next useful step</h2>
          <div className="mt-6 space-y-3">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-950">{action.label}</h3>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{action.description}</p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
