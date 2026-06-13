import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  FileSearch,
  Sparkles,
  MessageSquare,
  Send,
  BarChart2,
  Briefcase,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr ? "خدماتنا — JobAI24" : "Our Services — JobAI24",
    description: isAr
      ? "كل الأدوات التي تحتاجها للحصول على وظيفتك القادمة — تحليل السيرة الذاتية، تحسينها، التدريب على المقابلات، والتقديم الذكي."
      : "Everything you need to land your next job — resume analysis, enhancement, interview training, and smart applications.",
  };
}

const SERVICES_AR = [
  {
    icon: FileSearch,
    badge: "تحليل السيرة الذاتية",
    title: "اكتشف لماذا تُرفض سيرتك — قبل التقديم",
    desc: "تحليل فوري بالذكاء الاصطناعي يكشف نقاط الضعف والكلمات المفتاحية المفقودة ودرجة توافقك مع أنظمة ATS.",
    href: "/services/cv-analysis",
    color: "bg-brand-50 text-brand-600",
    accent: "border-brand-100",
  },
  {
    icon: Sparkles,
    badge: "تحسين السيرة الذاتية",
    title: "حوّل سيرتك إلى أداة تفتح أبواب الفرص",
    desc: "إعادة صياغة احترافية بالذكاء الاصطناعي تُبرز إنجازاتك وتتجاوز أنظمة الفرز وتجذب انتباه مسؤولي التوظيف.",
    href: "/services/resume-enhancement",
    color: "bg-teal-light/40 text-teal",
    accent: "border-teal-light",
  },
  {
    icon: MessageSquare,
    badge: "التدريب على المقابلات",
    title: "تدرّب على الوظيفة قبل يوم المقابلة الحقيقية",
    desc: "محاكاة مقابلات واقعية مخصصة للوظيفة والمجال ومستوى الخبرة — مع تقييم فوري وتوصيات للتحسين.",
    href: "/services/ai-interview",
    color: "bg-blue-50 text-blue-600",
    accent: "border-blue-100",
  },
  {
    icon: Send,
    badge: "التقديم الذكي",
    title: "لا تنتظر الوظائف — اصنع فرصك بنفسك",
    desc: "أنشئ وأدِر حملات تقديم احترافية توصل سيرتك لجهات التوظيف المناسبة برسائل مخصصة ومقنعة.",
    href: "/services/smart-send",
    color: "bg-amber-50 text-amber-600",
    accent: "border-amber-100",
  },
  {
    icon: Briefcase,
    badge: "مطابقة الوظائف",
    title: "اعثر على الوظائف التي تناسب ملفك المهني",
    desc: "يحلل النظام خبراتك ومهاراتك ويُرشّح لك الفرص الأكثر توافقاً — بدلاً من التصفح العشوائي.",
    href: "/services/job-search",
    color: "bg-purple-50 text-purple-600",
    accent: "border-purple-100",
  },
  {
    icon: BarChart2,
    badge: "السعودة والنطاقات",
    title: "تحقق من نسب السعودة واستوف متطلبات النطاقات",
    desc: "تحليل فوري لنسب التوطين في شركتك وفق معايير نطاقات وتوصيات عملية للامتثال الكامل.",
    href: "/services/saudization",
    color: "bg-green-50 text-green-600",
    accent: "border-green-100",
  },
];

const SERVICES_EN = [
  {
    icon: FileSearch,
    badge: "CV Analysis",
    title: "Find out why your resume is rejected — before you apply",
    desc: "Instant AI analysis revealing weak points, missing keywords, and your ATS compatibility score.",
    href: "/services/cv-analysis",
    color: "bg-brand-50 text-brand-600",
    accent: "border-brand-100",
  },
  {
    icon: Sparkles,
    badge: "Resume Enhancement",
    title: "Transform your resume into a door-opener",
    desc: "Professional AI rewriting that highlights your achievements, beats ATS filters, and gets recruiter attention.",
    href: "/services/resume-enhancement",
    color: "bg-teal-light/40 text-teal",
    accent: "border-teal-light",
  },
  {
    icon: MessageSquare,
    badge: "Interview Training",
    title: "Practice the job before your real interview day",
    desc: "Realistic interview simulations tailored to your role, field, and experience — with instant scoring and tips.",
    href: "/services/ai-interview",
    color: "bg-blue-50 text-blue-600",
    accent: "border-blue-100",
  },
  {
    icon: Send,
    badge: "Smart Applications",
    title: "Don't wait for job posts — create your own opportunities",
    desc: "Launch and manage professional outreach campaigns that deliver your CV to the right employers with personalized messages.",
    href: "/services/smart-send",
    color: "bg-amber-50 text-amber-600",
    accent: "border-amber-100",
  },
  {
    icon: Briefcase,
    badge: "Job Matching",
    title: "Find jobs that match your professional profile",
    desc: "The system analyzes your experience and skills to surface the most relevant opportunities — no more random browsing.",
    href: "/services/job-search",
    color: "bg-purple-50 text-purple-600",
    accent: "border-purple-100",
  },
  {
    icon: BarChart2,
    badge: "Saudization & Nitaqat",
    title: "Check your Saudization rates and meet Nitaqat requirements",
    desc: "Instant nationalization compliance analysis with practical recommendations to fully meet regulatory requirements.",
    href: "/services/saudization",
    color: "bg-green-50 text-green-600",
    accent: "border-green-100",
  },
];

export default async function ServicesPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const services = isAr ? SERVICES_AR : SERVICES_EN;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="bg-slate-950 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionBadge className="border-brand-500/30 bg-brand-500/10 text-brand-300">
            {isAr ? "منصة JobAI24" : "JobAI24 Platform"}
          </SectionBadge>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            {isAr
              ? "كل ما تحتاجه للحصول على وظيفتك القادمة"
              : "Everything you need to land your next job"}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">
            {isAr
              ? "رحلة متكاملة من السيرة الذاتية إلى المقابلة — في منصة واحدة مصممة لسوق العمل الخليجي."
              : "An integrated journey from resume to interview — in one platform built for the Gulf job market."}
          </p>
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => {
              const Icon = svc.icon;
              return (
                <Link
                  key={svc.href}
                  href={svc.href}
                  className={`group flex flex-col rounded-2xl border ${svc.accent} bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-panel`}
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${svc.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {svc.badge}
                  </span>
                  <h2 className="mb-2 text-base font-black leading-snug text-slate-950 group-hover:text-brand-700">
                    {svc.title}
                  </h2>
                  <p className="flex-1 text-sm leading-relaxed text-slate-500">{svc.desc}</p>
                  <div className={`mt-5 flex items-center gap-1.5 text-sm font-bold text-brand-600 ${isAr ? "flex-row-reverse" : ""}`}>
                    <span>{isAr ? "اعرف أكثر" : "Learn more"}</span>
                    <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
