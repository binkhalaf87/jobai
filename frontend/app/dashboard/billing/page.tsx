import { Panel } from "@/components/panel";

const BILLING_CARDS = [
  {
    title: "Current plan",
    value: "Starter",
    note: "A future subscription service can replace this placeholder with live plan data."
  },
  {
    title: "This month's usage",
    value: "0 analyses",
    note: "Usage-based billing summaries can surface here later."
  },
  {
    title: "Upcoming invoice",
    value: "$0.00",
    note: "Invoice previews and renewal details can be added when billing is connected."
  }
];

// This billing page reserves a clean space for subscriptions, usage, and invoice visibility.
export default function DashboardBillingPage() {
  return (
    <div className="space-y-6">
      <Panel className="p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Billing</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          Keep subscriptions, usage, and invoices easy to review
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          This screen is intentionally simple and practical so payment information can slot in later without changing
          the overall dashboard structure.
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        {BILLING_CARDS.map((card) => (
          <Panel key={card.title} className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.title}</p>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.note}</p>
          </Panel>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Billing Activity</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Invoices and payment history</h2>
        <div className="mt-6 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-base font-semibold text-slate-900">No billing records yet</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Add live invoice rows, payment methods, and plan-management actions here once the billing backend is ready.
          </p>
        </div>
      </Panel>
    </div>
  );
}
