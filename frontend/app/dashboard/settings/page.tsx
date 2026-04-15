import { Panel } from "@/components/panel";

const SETTINGS_SECTIONS = [
  {
    title: "Profile",
    description: "Basic account details."
  },
  {
    title: "Security",
    description: "Password and access settings."
  },
  {
    title: "Notifications",
    description: "Email and product alerts."
  }
];

// This settings page keeps account configuration grouped clearly without adding account logic yet.
export default function DashboardSettingsPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Workspace settings
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Simple settings for your account and workspace.
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
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Coming next</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Ready for future forms</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Profile</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Main details live here.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Workspace</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Theme and default behavior live here.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
