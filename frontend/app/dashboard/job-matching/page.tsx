import { Panel } from "@/components/panel";

// Job Matching: surface the best-fit job listings for the user's resume profile.
export default function DashboardJobMatchingPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Job Matching</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Find roles where your resume already fits well
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Upload your resume once and let JobAI surface job listings that match your skills profile. Each match
          shows a predicted fit score before you apply.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Coming soon
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "Smart matching",
            description:
              "Matches are ranked by how well your resume satisfies the job's keyword, skill, and experience requirements.",
          },
          {
            title: "Pre-apply scoring",
            description:
              "See your fit score for each listing before you apply so you can prioritize the best opportunities.",
          },
          {
            title: "Saved searches",
            description:
              "Define target roles and locations once, and let the matcher surface new postings automatically.",
          },
          {
            title: "One-click analysis",
            description:
              "Jump straight from a matched listing into a full analysis run without copy-pasting the description.",
          },
        ].map((item) => (
          <Panel key={item.title} className="p-6">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
