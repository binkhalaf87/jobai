import { Panel } from "@/components/panel";

// AI Interview: practice role-specific interview questions with AI feedback.
export default function DashboardAiInterviewPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">AI Interview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Practice interviews tailored to your target role
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Answer role-specific behavioral and technical questions, receive instant AI feedback on structure and
          delivery, and build confidence before the real interview.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Coming soon
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Role-specific questions",
            description: "Questions are generated from the job description you are targeting, not generic lists.",
          },
          {
            title: "STAR method feedback",
            description: "AI evaluates your answers for Situation, Task, Action, and Result structure.",
          },
          {
            title: "Mock sessions",
            description: "Complete timed mock sessions that simulate a real recruiter screening call.",
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
