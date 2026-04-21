import Link from "next/link";
import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";
import { useTranslations } from "next-intl";
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  FileText, 
  Target, 
  Zap, 
  Globe 
} from "lucide-react"; // تأكد من تثبيت lucide-react

export default function HomePage() {
  const t = useTranslations("marketing");

  const services = [
    {
      title: t("services.jobSearch.title"),
      description: t("services.jobSearch.description"),
      icon: <Search className="h-6 w-6" />,
      color: "bg-blue-500/10 text-blue-600"
    },
    {
      title: t("services.resumeAnalysis.title"),
      description: t("services.resumeAnalysis.description"),
      icon: <FileText className="h-6 w-6" />,
      color: "bg-purple-500/10 text-purple-600"
    },
    {
      title: t("services.jobMatching.title"),
      description: t("services.jobMatching.description"),
      icon: <Target className="h-6 w-6" />,
      color: "bg-emerald-500/10 text-emerald-600"
    }
  ];

  return (
    <PageContainer className="space-y-24 pb-20">
      {/* --- Hero Section --- */}
      <section className="relative mt-4 overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-16 text-white shadow-2xl md:px-16 md:py-24">
        {/* الخلفية المزخرفة */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-brand-600/20 blur-[100px]" />
          <div className="absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
        </div>

        <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
              <Sparkles className="h-4 w-4 text-brand-400" />
              <span className="text-slate-300">{t("hero.badge")}</span>
            </div>
            
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              {t("hero.title")}
              <span className="block bg-gradient-to-r from-brand-400 to-emerald-400 bg-clip-text text-transparent">
                بذكاء اصطناعي فائق.
              </span>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-slate-400">
              {t("hero.description")}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-8 py-4 text-sm font-bold text-white transition-all hover:bg-brand-400 hover:shadow-[0_0_20px_rgba(140,92,247,0.4)]"
              >
                {t("hero.cta")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white transition hover:bg-white/10 hover:border-white/20"
              >
                {t("hero.quickTour")}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-4">
              {[
                { label: t("hero.stats.fasterMatchingDesc"), val: t("hero.stats.fasterMatching") },
                { label: t("hero.stats.resumesAnalyzedDesc"), val: t("hero.stats.resumesAnalyzed") },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-2xl font-bold text-white">{stat.val}</p>
                  <p className="text-xs uppercase tracking-widest text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* البوكس التفاعلي (Preview Card) */}
          <div className="relative hidden lg:block">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-2 backdrop-blur-sm">
              <div className="rounded-[1.4rem] bg-slate-900 p-6 shadow-inner">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500/50" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500">AI Analysis Engine v2.0</div>
                </div>
                
                <div className="space-y-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 w-3/4 rounded bg-slate-800" />
                    <div className="h-4 w-1/2 rounded bg-slate-800" />
                  </div>
                  <div className="rounded-2xl border border-brand-500/30 bg-brand-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 h-5 w-5 text-brand-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">تحسين التوافق مع ATS</p>
                        <p className="text-xs text-slate-400 mt-1">تم رفع درجة مطابقة سيرتك الذاتية إلى 94% لوظيفة محلل بيانات.</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                      <p className="text-xs text-slate-500">الكلمات المفتاحية</p>
                      <p className="text-sm font-mono text-emerald-400">+12 دقيقة</p>
                    </div>
                    <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                      <p className="text-xs text-slate-500">ترتيب التنسيق</p>
                      <p className="text-sm font-mono text-brand-400">مثالي</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Services Section --- */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-brand-600">{t("services.eyebrow")}</h2>
          <h3 className="text-4xl font-bold tracking-tight text-slate-900">{t("services.title")}</h3>
          <p className="mx-auto max-w-2xl text-slate-600">{t("services.description")}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {services.map((service, idx) => (
            <div 
              key={idx} 
              className="group relative rounded-3xl border border-slate-100 bg-white p-8 transition-all hover:border-brand-200 hover:shadow-xl hover:shadow-brand-500/5"
            >
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${service.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                {service.icon}
              </div>
              <h4 className="mb-3 text-xl font-bold text-slate-900">{service.title}</h4>
              <p className="text-sm leading-relaxed text-slate-500">{service.description}</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-bold text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                {t("services.viewDetails")}
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* --- Bento Grid / Features Section --- */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2 rounded-[2.5rem] bg-slate-50 p-10 border-none">
          <div className="flex flex-col h-full justify-between gap-8">
            <div className="space-y-4">
              <span className="rounded-full bg-white px-4 py-1 text-xs font-bold text-slate-500 shadow-sm">
                {t("dashboardPreview.badge")}
              </span>
              <h3 className="text-3xl font-bold text-slate-900">{t("dashboardPreview.title")}</h3>
              <p className="max-w-md text-slate-600">{t("dashboardPreview.insights.topCandidateDesc")}</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: t("dashboardPreview.stats.todayMatch"), val: t("dashboardPreview.stats.todayMatchValue"), icon: <Zap className="h-4 w-4" /> },
                { label: t("dashboardPreview.stats.cvScore"), val: t("dashboardPreview.stats.cvScoreValue"), icon: <CheckCircle2 className="h-4 w-4" /> },
                { label: "دعم RTL", val: "كامل", icon: <Globe className="h-4 w-4" /> },
              ].map((item, i) => (
                <div key={i} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                  <div className="text-brand-500 mb-2">{item.icon}</div>
                  <p className="text-2xl font-bold text-slate-900">{item.val}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="rounded-[2.5rem] bg-brand-600 p-10 text-white shadow-xl shadow-brand-500/20">
          <h3 className="text-2xl font-bold mb-6">{t("why.title")}</h3>
          <ul className="space-y-4">
            {(t.raw("why.points") as string[]).map((point, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-brand-50">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-300" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Call to Action --- */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-brand-600 to-brand-800 px-8 py-12 text-center text-white">
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold md:text-4xl">{t("cta.title")}</h2>
          <p className="mx-auto max-w-xl text-brand-100">{t("cta.description")}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="rounded-full bg-white px-10 py-4 text-sm font-bold text-brand-600 shadow-xl transition hover:bg-brand-50">
              {t("cta.register")}
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
