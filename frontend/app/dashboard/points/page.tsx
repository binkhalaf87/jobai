import { Panel } from "@/components/panel";

// Points: credit balance, usage history, and top-up options.
export default function DashboardPointsPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Points</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Your credit balance and usage history
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Points are the credit unit used across the platform. Each analysis, enhancement, and AI interview session
          costs a set number of points. Top up any time from this page.
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Available points", value: "0", note: "Points are added when you subscribe or purchase a top-up." },
          { label: "Used this month", value: "0", note: "Tracks point spend across all AI features for the current period." },
          { label: "Points earned", value: "0", note: "Bonus points from referrals and completed onboarding steps." },
        ].map((card) => (
          <Panel key={card.label} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Usage History</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Point transactions</h2>
        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-base font-semibold text-slate-900">No transactions yet</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Every analysis, enhancement, and AI feature usage will be logged here with a timestamp and point cost.
          </p>
        </div>
      </Panel>
    </div>
  );
}
