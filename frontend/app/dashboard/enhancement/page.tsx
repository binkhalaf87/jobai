import Link from "next/link";

import { Panel } from "@/components/panel";

// Enhancement: AI-powered resume rewriting and section improvement suggestions.
export default function DashboardEnhancementPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Enhancement</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Rewrite your resume with AI-driven suggestions
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          After running an analysis, use the Enhancement tools to get section-by-section rewrites tailored to your
          target role. Each suggestion explains the reasoning so you stay in control.
        </p>
        <div className="mt-6">
          <Link
            href="/dashboard/new-analysis"
            className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Run an analysis first
          </Link>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Section rewrites",
            description:
              "Get AI suggestions for Summary, Experience, Skills, and Education sections — each aligned with the job's keyword requirements.",
          },
          {
            title: "Keyword optimization",
            description:
              "Surface missing keywords from the job description and get suggestions for working them naturally into your resume.",
          },
          {
            title: "Tone & clarity",
            description:
              "Improve sentence structure, remove passive voice, and sharpen bullet points for maximum ATS and recruiter impact.",
          },
          {
            title: "Version tracking",
            description:
              "Compare applied rewrites against your original text so you can roll back any change with full context.",
          },
        ].map((item) => (
          <Panel key={item.title} className="p-6">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Recent Suggestions</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Applied and pending rewrites</h2>
        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-base font-semibold text-slate-900">No suggestions generated yet</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Run an analysis and open the results page to generate AI rewrite suggestions for each resume section.
          </p>
        </div>
      </Panel>
    </div>
  );
}
