import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function DashboardAnalysesPage() {
  const t = await getTranslations("analysis.history");

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-800/8 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-teal/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">{t("eyebrow")}</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                {t("description")}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/analysis"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-800/20 transition hover:bg-brand-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t("newButton")}
          </Link>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: t("metrics.completed.label"), value: "—", note: t("metrics.completed.note") },
          { label: t("metrics.average.label"), value: "—", note: t("metrics.average.note") },
          { label: t("metrics.best.label"), value: "—", note: t("metrics.best.note") },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{card.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{card.note}</p>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t("list.eyebrow")}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{t("list.title")}</h2>
          </div>
          <Link
            href="/dashboard/analysis"
            className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            {t("list.newAction")}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          </div>
          <p className="text-base font-bold text-slate-900">{t("list.emptyTitle")}</p>
          <p className="mt-2 max-w-md mx-auto text-sm leading-6 text-slate-500">
            {t("list.emptyDescription")}
          </p>
          <Link
            href="/dashboard/analysis"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            {t("list.emptyCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}
