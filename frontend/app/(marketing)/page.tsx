import Link from "next/link";

import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";

const STARTER_SECTIONS = [
  {
    title: "Resume Review",
    description: "Upload your CV and start fast."
  },
  {
    title: "Match Insights",
    description: "See fit, gaps, and next moves."
  },
  {
    title: "Team Workspaces",
    description: "Track candidates and hiring steps."
  }
];

// Landing page: introduces the product and routes visitors to auth or the dashboard.
export default function HomePage() {
  return (
    <PageContainer className="space-y-8">
      <Panel className="grid gap-10 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
            AI Career Platform
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
              Analyze, improve, and send your CV faster.
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600 md:text-lg">
              One workspace for ATS checks, CV improvements, interview practice, job fit, and outreach.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Start free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
            >
              Sign in
            </Link>
          </div>
        </div>
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          {STARTER_SECTIONS.map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-base font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel className="p-6">
          <p className="text-sm font-medium text-slate-500">Analysis</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">CV scoring</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Check ATS fit and missing keywords fast.
          </p>
        </Panel>
        <Panel className="p-6">
          <p className="text-sm font-medium text-slate-500">Enhancement</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">AI improvements</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Rewrite weak sections in a few clicks.
          </p>
        </Panel>
        <Panel className="p-6">
          <p className="text-sm font-medium text-slate-500">Interview Prep</p>
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">Mock interviews</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Practice answers before the real interview.
          </p>
        </Panel>
      </div>
    </PageContainer>
  );
}
