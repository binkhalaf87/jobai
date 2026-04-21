import Link from "next/link";

import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("marketing");

  const services = [
    {
      title: t("services.jobSearch.title"),
      description: t("services.jobSearch.description"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    },
    {
      title: t("services.resumeAnalysis.title"),
      description: t("services.resumeAnalysis.description"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M9 12h6" />
          <path d="M9 16h4" />
          <path d="M13 6h6" />
          <path d="M5 21h14a2 2 0 0 0 2-2V7.5L15.5 2H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2z" />
        </svg>
      )
    },
    {
      title: t("services.jobMatching.title"),
      description: t("services.jobMatching.description"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M21 15V5a2 2 0 0 0-2-2H11" />
          <path d="M7 7H3v14a2 2 0 0 0 2 2h14v-4" />
          <path d="M14 3l7 7" />
        </svg>
      )
    }
  ];

  const features = [
    {
      title: t("features.aiPowered.title"),
      description: t("features.aiPowered.description"),
      badge: t("features.aiPowered.badge")
    },
    {
      title: t("features.simpleInterface.title"),
      description: t("features.simpleInterface.description"),
      badge: t("features.simpleInterface.badge")
    },
    {
      title: t("features.rtlSupport.title"),
      description: t("features.rtlSupport.description"),
      badge: t("features.rtlSupport.badge")
    }
  ];

  const jobs = [
    {
      title: t("jobs.aiAnalyst.title"),
      company: t("jobs.aiAnalyst.company"),
      location: t("jobs.aiAnalyst.location"),
      type: t("jobs.aiAnalyst.type")
    },
    {
      title: t("jobs.recruitmentEngineer.title"),
      company: t("jobs.recruitmentEngineer.company"),
      location: t("jobs.recruitmentEngineer.location"),
      type: t("jobs.recruitmentEngineer.type")
    },
    {
      title: t("jobs.uxManager.title"),
      company: t("jobs.uxManager.company"),
      location: t("jobs.uxManager.location"),
      type: t("jobs.uxManager.type")
    }
  ];

  return (
    <PageContainer className="space-y-16">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-700 to-slate-950 px-6 py-10 text-white shadow-soft md:px-12 md:py-16">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(140,92,247,0.22),transparent_40%)]" />
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-100/90">
              {t("hero.badge")}
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              {t("hero.title")}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-100/85 md:text-lg">
              {t("hero.description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/15 transition hover:bg-slate-100"
              >
                {t("hero.cta")}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                {t("hero.quickTour")}
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 shadow-panel">
                <p className="text-3xl font-semibold">{t("hero.stats.fasterMatching")}</p>
                <p className="mt-1 text-slate-200">{t("hero.stats.fasterMatchingDesc")}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 shadow-panel">
                <p className="text-3xl font-semibold">{t("hero.stats.resumesAnalyzed")}</p>
                <p className="mt-1 text-slate-200">{t("hero.stats.resumesAnalyzedDesc")}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 shadow-panel">
                <p className="text-3xl font-semibold">{t("hero.stats.userSatisfaction")}</p>
                <p className="mt-1 text-slate-200">{t("hero.stats.userSatisfactionDesc")}</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between rounded-3xl bg-white/10 p-4 text-sm text-slate-100">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-200/80">{t("hero.demo.nextJob")}</p>
                  <p className="mt-1 text-base font-semibold text-white">{t("hero.demo.jobTitle")}</p>
                </div>
                <div className="rounded-2xl bg-brand-800 px-3 py-2 text-xs font-semibold text-white">{t("hero.demo.status")}</div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2 rounded-3xl bg-brand-900/60 p-5">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">CV</span>
                    <span>{t("hero.demo.features.smartAnalysis")}</span>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-brand-900/90 p-4 text-sm text-slate-200">
                    <p className="font-semibold">{t("hero.demo.features.recommendations")}</p>
                    <p className="mt-2 text-xs text-slate-400">{t("hero.demo.features.recommendationsDesc")}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-brand-900/70 p-5 text-sm text-slate-200">
                  <p className="font-semibold">{t("hero.demo.features.matchingSkills")}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Python','Data','AI','SQL'].map((skill) => (
                      <span key={skill} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-brand-500/20 bg-white/5 p-5 text-sm text-slate-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-brand-200">{t("hero.demo.features.inviteTitle")}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100/90">
                    {t("hero.demo.features.inviteDesc")}
                  </p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 top-10 h-16 w-16 rounded-full bg-brand-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-teal-light opacity-80 blur-3xl" />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-800/90">{t("services.eyebrow")}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{t("services.title")}</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            {t("services.description")}
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {services.map((service) => (
            <Panel key={service.title} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-panel">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
                {service.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                {t("services.viewDetails")}
                <span aria-hidden="true">→</span>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{t("dashboardPreview.eyebrow")}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{t("dashboardPreview.title")}</h2>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              <span className="h-2.5 w-2.5 rounded-full bg-mint"></span>
              {t("dashboardPreview.badge")}
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t("dashboardPreview.stats.todayMatch")}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{t("dashboardPreview.stats.todayMatchValue")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("dashboardPreview.stats.todayMatchDesc")}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t("dashboardPreview.stats.cvScore")}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{t("dashboardPreview.stats.cvScoreValue")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("dashboardPreview.stats.cvScoreDesc")}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t("dashboardPreview.stats.jobSuggestions")}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{t("dashboardPreview.stats.jobSuggestionsValue")}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("dashboardPreview.stats.jobSuggestionsDesc")}</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">{t("dashboardPreview.insights.topCandidate")}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t("dashboardPreview.insights.topCandidateDesc")}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">{t("dashboardPreview.insights.quickTip")}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t("dashboardPreview.insights.quickTipDesc")}</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">{t("jobs.eyebrow")}</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">{t("jobs.title")}</h3>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{t("jobs.updated")}</span>
            </div>
            <div className="mt-6 space-y-4">
              {jobs.map((job) => (
                <div key={job.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{job.title}</h4>
                      <p className="mt-2 text-sm text-slate-600">{job.company} · {job.location}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{job.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-brand-50 p-6 text-slate-950">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">{t("why.title")}</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              {(t.raw("why.points") as string[]).map((point, index) => (
                <li key={index}>• {point}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_0.7fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-800">{t("cta.eyebrow")}</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              {t("cta.title")}
            </h2>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              {t("cta.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
              {t("cta.register")}
            </Link>
            <Link href="/login" className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              {t("cta.login")}
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
