import { Panel } from "@/components/panel";

const SETTINGS_SECTIONS = [
  {
    title: "Profile",
    description: "Reserve this area for name, email, and profile preferences."
  },
  {
    title: "Security",
    description: "Use this section later for password updates, sessions, and login controls."
  },
  {
    title: "Notifications",
    description: "Future email alerts, product updates, and analysis reminders can live here."
  }
];

// This settings page keeps account configuration grouped clearly without adding account logic yet.
export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          A clean place for account and workspace preferences
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Keep account configuration separate from analysis work so the dashboard stays practical as more features are
          added.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        {SETTINGS_SECTIONS.map((section) => (
          <Panel key={section.title} className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{section.title}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Starter Form Areas</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Prepared for future account forms</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Profile details</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Name, headline, and contact preferences can be managed here later.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Workspace preferences</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Theme options, notification rules, and default analysis behavior can live in this card.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
