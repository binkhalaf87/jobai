import { Panel } from "@/components/panel";

// Smart Send: AI-assisted job application workflow with tailored cover letters.
export default function DashboardSmartSendPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Smart Send</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Apply smarter with AI-crafted cover letters
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Generate targeted cover letters, track application status, and manage follow-up actions — all from one
          place so your job search stays organized and intentional.
        </p>
        <div className="mt-4 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          Coming soon
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Tailored cover letters",
            description:
              "AI drafts a cover letter that mirrors the job description's language and highlights your strongest matching experience.",
          },
          {
            title: "Application tracker",
            description:
              "Track every application by status — Drafted, Sent, Interview, Offer, Rejected — in one clean pipeline view.",
          },
          {
            title: "Follow-up reminders",
            description:
              "Set follow-up dates and get reminders so no opportunity goes cold because of a missed check-in.",
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
