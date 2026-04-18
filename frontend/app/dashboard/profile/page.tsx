import { getTranslations } from "next-intl/server";

import { Panel } from "@/components/panel";

const PROFILE_SECTION_KEYS = ["personalInfo", "security", "notifications"] as const;

export default async function DashboardProfilePage() {
  const t = await getTranslations("profilePage");

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 p-6 md:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-800/8 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-teal/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
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
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {PROFILE_SECTION_KEYS.map((sectionKey) => (
          <div key={sectionKey} className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              {sectionKey === "personalInfo" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ) : sectionKey === "security" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900">{t(`sections.${sectionKey}.title`)}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">{t(`sections.${sectionKey}.description`)}</p>
          </div>
        ))}
      </div>

      <Panel className="p-6 md:p-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t("details.eyebrow")}</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">{t("details.title")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">{t("details.cards.profile.title")}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {t("details.cards.profile.description")}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">{t("details.cards.security.title")}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {t("details.cards.security.description")}
            </p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
