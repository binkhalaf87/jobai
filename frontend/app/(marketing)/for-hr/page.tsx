import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ScanSearch, Users, Send, BarChart3, ShieldCheck, Clock } from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr ? "للشركات وفرق التوظيف — JobAI24" : "For HR Teams — JobAI24",
    description: isAr
      ? "أدوات توظيف بالذكاء الاصطناعي للشركات: فحص ATS جماعي للسير الذاتية، مقابلات ذكية، ووصول مباشر لمرشحين مؤهلين."
      : "AI hiring tools for companies: bulk ATS resume screening, AI interviews, and direct access to qualified candidates.",
  };
}

const AR = {
  badge: "للشركات وفرق التوظيف",
  h1: "وظّف أسرع وأدق مع الذكاء الاصطناعي",
  sub: "نفس التقنية التي تساعد المرشحين على التميز، تساعد فريقك على اكتشافهم — فحص جماعي للسير، مقابلات ذكية، ومرشحون يصلونك مباشرة.",
  cta: "جرّب مجاناً للشركات",
  features: [
    {
      icon: "scan",
      title: "فحص ATS جماعي للسير الذاتية",
      desc: "ارفع عشرات السير دفعة واحدة واحصل على ترتيب فوري للمرشحين حسب التوافق مع الوظيفة، مع تقرير مفصل لكل مرشح.",
    },
    {
      icon: "users",
      title: "أدوات توظيف لفريق كامل",
      desc: "إدارة الوظائف والمرشحين والتقارير في لوحة واحدة — من نشر الوظيفة إلى قرار التوظيف.",
    },
    {
      icon: "send",
      title: "مرشحون يصلونك عبر التسويق الذكي",
      desc: "استقبل ملفات مرشحين مؤهلين ومطابقين لاحتياجك مباشرة من منصة JobAI24 — بدون إعلانات وبدون وسطاء.",
    },
    {
      icon: "chart",
      title: "مقابلات وتقييم بالذكاء الاصطناعي",
      desc: "مقابلات فرز آلية بأسئلة مخصصة لكل وظيفة، مع تقييم فوري للإجابات وتقارير قابلة للمشاركة مع فريقك.",
    },
    {
      icon: "clock",
      title: "وفّر ٨٠٪ من وقت الفرز",
      desc: "ما كان يستغرق أياماً من المراجعة اليدوية يُنجز في دقائق — ليركّز فريقك على المقابلات النهائية فقط.",
    },
    {
      icon: "shield",
      title: "التزام بنظام حماية البيانات",
      desc: "بيانات المرشحين تُعالج وفق نظام حماية البيانات الشخصية السعودي (PDPL) وبموافقة أصحابها.",
    },
  ],
  finalCta: {
    h2: "جاهز لتطوير توظيفك؟",
    sub: "أنشئ حساب شركة مجاناً وابدأ الفرز الذكي اليوم.",
    cta: "إنشاء حساب شركة",
    note: "بدون بطاقة ائتمانية",
  },
};

const EN = {
  badge: "For HR Teams & Companies",
  h1: "Hire faster and smarter with AI",
  sub: "The same technology that helps candidates stand out helps your team discover them — bulk resume screening, AI interviews, and qualified candidates delivered to you.",
  cta: "Try Free for Companies",
  features: [
    {
      icon: "scan",
      title: "Bulk ATS Resume Screening",
      desc: "Upload dozens of resumes at once and get an instant candidate ranking by job fit, with a detailed report for each applicant.",
    },
    {
      icon: "users",
      title: "Hiring Tools for the Whole Team",
      desc: "Manage jobs, candidates, and reports in one dashboard — from posting the role to making the hire.",
    },
    {
      icon: "send",
      title: "Candidates Reach You via Smart Marketing",
      desc: "Receive profiles of qualified, role-matched candidates directly from the JobAI24 platform — no job ads, no middlemen.",
    },
    {
      icon: "chart",
      title: "AI Interviews & Scoring",
      desc: "Automated screening interviews with role-specific questions, instant answer scoring, and shareable reports for your team.",
    },
    {
      icon: "clock",
      title: "Cut Screening Time by 80%",
      desc: "What used to take days of manual review is done in minutes — so your team focuses only on final interviews.",
    },
    {
      icon: "shield",
      title: "Data Protection Compliant",
      desc: "Candidate data is processed in line with the Saudi Personal Data Protection Law (PDPL) and with candidate consent.",
    },
  ],
  finalCta: {
    h2: "Ready to upgrade your hiring?",
    sub: "Create a free company account and start smart screening today.",
    cta: "Create Company Account",
    note: "No credit card required",
  },
};

const ICONS = {
  scan: ScanSearch,
  users: Users,
  send: Send,
  chart: BarChart3,
  clock: Clock,
  shield: ShieldCheck,
} as const;

export default async function ForHRPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionBadge>{t.badge}</SectionBadge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
            {t.h1}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-500">{t.sub}</p>
          <Link
            href="/register?role=recruiter"
            className="mt-8 inline-flex rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200/50"
          >
            {t.cta}
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map((f) => {
              const Icon = ICONS[f.icon as keyof typeof ICONS];
              return (
                <div
                  key={f.title}
                  className="rounded-2xl border border-white bg-white p-6 shadow-sm transition-all hover:shadow-panel"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-bold text-slate-950">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            {t.finalCta.h2}
          </h2>
          <p className="mt-3 text-slate-500">{t.finalCta.sub}</p>
          <Link
            href="/register?role=recruiter"
            className="mt-7 inline-flex rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200/50"
          >
            {t.finalCta.cta}
          </Link>
          <p className="mt-2 text-xs text-slate-400">{t.finalCta.note}</p>
        </div>
      </section>
    </div>
  );
}
