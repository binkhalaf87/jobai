import { Panel } from "@/components/panel";

// Profile: user account details, preferences, and security settings.
export default function DashboardProfilePage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Profile</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Manage your account and preferences
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Keep your profile details up to date, manage security settings, and control how the platform behaves
          for your workflow.
        </p>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Personal details",
            description: "Update your name, email address, and profile photo.",
          },
          {
            title: "Security",
            description: "Change your password, review active sessions, and manage login methods.",
          },
          {
            title: "Notifications",
            description: "Configure email alerts for analysis results, usage limits, and product updates.",
          },
        ].map((section) => (
          <Panel key={section.title} className="p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{section.title}</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">{section.description}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Account Details</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Your information</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Profile details form</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Name, email, and contact preferences can be edited here once the profile update endpoint is connected.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Password & security</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Password change and session management actions can be added here once the auth endpoints are extended.
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
