import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  ShieldCheck,
  CheckCircle2,
  BarChart3,
  AlertCircle,
  FileText,
  Brain,
  TrendingUp,
  Clock,
  Building2,
  Users,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Target,
  Download,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "فحص نطاقات السعودة والامتثال — JobAI24"
      : "Saudization & Nitaqat Compliance Check — JobAI24",
    description: isAr
      ? "اعرف وضع نطاقاتك قبل أن تُفاجأ. تحليل فوري لامتثال السعودة بالمهنة والقطاع مع توصيات ذكاء اصطناعي لسد الفجوات — قبل وصول مفتش وزارة الموارد البشرية."
      : "Know your Nitaqat compliance status before you're caught off guard. Instant profession-by-profession Saudization analysis with AI recommendations to close gaps — before HRSD shows up.",
  };
}

const AR = {
  hero: {
    badge: "نطاقات · السعودة · الامتثال",
    h1: "اعرف وضع نطاقاتك قبل أن تُفاجأ",
    sub: "معظم الشركات تكتشف انتهاكات السعودة عند التدقيق — وهو وقت متأخر جداً. JobAI24 يُحلّل وضعك الفعلي بالمهنة والقطاع ويُقدم توصيات ذكية لسد الفجوات قبل أن تصبح مشكلة.",
    cta: "تحقق من وضع نطاقاتك",
    trust: ["تحليل فوري", "تقسيم بالمهنة والقطاع", "توصيات ذكاء اصطناعي"],
  },
  what: {
    title: "ما هذه الخدمة؟",
    paras: [
      "خدمة فحص السعودة هي أداة تحليل امتثال متخصصة للشركات العاملة في المملكة العربية السعودية. ترفع تقرير مؤشر التأمينات الاجتماعية (GOSI) وقرارات السعودة — والنظام يُحلل وضعك تلقائياً.",
      "الخدمة تُصنّف موظفيك بالمهنة والقطاع، وتحسب نسبة السعودة الفعلية مقارنةً بالمطلوبة، وتُحدد الفجوات بدقة — قبل أن تكتشفها وزارة الموارد البشرية والتنمية الاجتماعية.",
      "في النهاية تحصل على توصيات ذكاء اصطناعي محددة: أي المهن تحتاج سعودة إضافية، وما العدد المطلوب، وكيف تُعيد توزيع القوى العاملة لتحقيق الامتثال.",
    ],
  },
  benefits: {
    title: "ماذا ستحصل؟",
    cards: [
      {
        icon: "barChart",
        title: "تحليل امتثال فوري",
        desc: "نسبة السعودة الفعلية مقابل المطلوبة لكل مهنة وقطاع في ثوانٍ.",
      },
      {
        icon: "alertCircle",
        title: "كشف الانتهاكات بالتفصيل",
        desc: "قائمة دقيقة بكل مهنة أو قطاع يقع خارج نطاق الامتثال.",
      },
      {
        icon: "brain",
        title: "توصيات ذكاء اصطناعي للمعالجة",
        desc: "اقتراحات عملية ومحددة لسد فجوات السعودة في كل مهنة.",
      },
      {
        icon: "target",
        title: "محاكاة سيناريوهات التوظيف",
        desc: "استعرض كيف سيتأثر وضع نطاقاتك إذا وظّفت أو أنهيت عقود معينة.",
      },
      {
        icon: "download",
        title: "تقارير قابلة للتصدير",
        desc: "صدّر تقريرك بصيغة CSV أو PDF لمشاركته مع فريق الموارد البشرية أو مستشارك القانوني.",
      },
      {
        icon: "shieldCheck",
        title: "تحديث مستمر بالبيانات الجديدة",
        desc: "ارفع بيانات GOSI الجديدة في أي وقت واحصل على تحليل محدّث فوراً.",
      },
    ],
  },
  howItWorks: {
    title: "كيف يعمل؟",
    steps: [
      {
        n: "١",
        title: "ارفع بيانات GOSI وقرارات السعودة",
        desc: "ارفع ملف تقرير التأمينات وملف قرارات السعودة بصيغة Excel — النظام يقرأهما تلقائياً.",
      },
      {
        n: "٢",
        title: "راجع تحليل الامتثال",
        desc: "شاهد وضعك الدقيق بالمهنة والقطاع: ممتثل، انتهاك، أو دون الحد المطلوب.",
      },
      {
        n: "٣",
        title: "استلم التوصيات وطبّقها",
        desc: "احصل على توصيات ذكاء اصطناعي محددة وصدّر التقرير لفريق الموارد البشرية.",
      },
    ],
  },
  results: {
    title: "ما الذي يمكن أن تتوقعه؟",
    items: [
      "معرفة وضع امتثالك الحقيقي قبل أي تدقيق رسمي",
      "تحديد المهن والقطاعات التي تحتاج إجراء عاجلاً",
      "توفير وقت إعداد تقارير السعودة اليدوية",
      "اتخاذ قرارات توظيف مدروسة تُحسّن وضع نطاقاتك",
      "تقليل مخاطر الغرامات والعقوبات المرتبطة بانتهاكات السعودة",
    ],
  },
  audience: {
    title: "من يستفيد من هذه الخدمة؟",
    cards: [
      {
        icon: "building2",
        title: "الشركات متعددة القطاعات",
        desc: "إدارة الامتثال عبر قطاعات ومهن متعددة في آنٍ واحد بدون تعقيد.",
      },
      {
        icon: "users",
        title: "فرق الموارد البشرية",
        desc: "أداة مرجعية سريعة لمختصي HR لمتابعة وضع السعودة بدقة.",
      },
      {
        icon: "briefcase",
        title: "المستشارون القانونيون وشركات الامتثال",
        desc: "تقارير دقيقة وقابلة للتصدير تدعم أعمال الاستشارة والمراجعة.",
      },
    ],
  },
  why: {
    title: "لماذا JobAI24؟",
    items: [
      "تحليل بالمهنة والقطاع — لا أرقام إجمالية مُضللة",
      "توصيات ذكاء اصطناعي محددة وقابلة للتنفيذ",
      "أداة محاكاة لاختبار سيناريوهات التوظيف قبل تنفيذها",
      "تقارير احترافية قابلة للتصدير والمشاركة",
      "واجهة عربية أولاً — مصممة لسوق العمل السعودي",
      "تحديث فوري عند رفع بيانات جديدة",
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "ما الملفات التي أحتاج رفعها؟",
        a: "ملف تقرير مؤشر التأمينات الاجتماعية (GOSI) وملف قرارات السعودة — كلاهما بصيغة Excel.",
      },
      {
        q: "هل النظام يتعامل مع الشركات متعددة الفروع؟",
        a: "نعم. يمكنك إدارة أكثر من منشأة أو فرع ضمن الحساب الواحد.",
      },
      {
        q: "كيف تُحدّد الخدمة وضع الامتثال؟",
        a: "يُقارن النظام النسبة الفعلية لكل مهنة وقطاع بالنسبة المطلوبة في قرارات السعودة ويُصنّف: ممتثل، انتهاك، أو دون الحد.",
      },
      {
        q: "هل التحليل دقيق بالكامل؟",
        a: "التحليل يعتمد على الملفات التي ترفعها. دقة النتائج تعتمد على دقة بيانات GOSI وقرارات السعودة المرفوعة.",
      },
      {
        q: "هل بياناتي الحساسة آمنة؟",
        a: "نعم. جميع البيانات تُعالج بأمان وفق أعلى معايير حماية البيانات.",
      },
      {
        q: "هل يمكنني تصدير التقرير؟",
        a: "نعم. التقرير متاح للتصدير بصيغة CSV وPDF.",
      },
      {
        q: "ما الفرق بين وضع الامتثال ووضع الانتهاك؟",
        a: "الامتثال يعني أن نسبة السعودة في المهنة أو القطاع تساوي أو تتجاوز المطلوب. الانتهاك يعني أنها أقل من الحد الأدنى المنصوص عليه.",
      },
      {
        q: "هل يمكنني محاكاة تأثير التوظيف الجديد؟",
        a: "نعم. أداة المحاكاة تُتيح لك استعراض كيف ستتأثر نسب السعودة عند إضافة أو إنهاء عقود موظفين.",
      },
    ],
  },
  finalCta: {
    h2: "لا تنتظر التدقيق لتكتشف المشكلة",
    sub: "تحقق من وضع نطاقاتك اليوم وتصرف قبل فوات الأوان.",
    cta: "تحقق من وضع نطاقاتي",
    note: "تحليل فوري — بدون تعقيد",
  },
};

const EN = {
  hero: {
    badge: "Nitaqat · Saudization · Compliance",
    h1: "Know Your Nitaqat Status Before HRSD Does",
    sub: "Most companies discover Saudization violations when they're audited — by then it's too late. JobAI24 analyzes your real compliance status by profession and sector, and gives you AI recommendations to close gaps before they become a problem.",
    cta: "Check My Compliance Status",
    trust: ["Instant analysis", "Breakdown by profession & sector", "AI recommendations"],
  },
  what: {
    title: "What is this service?",
    paras: [
      "The Saudization Compliance Check is a specialized compliance analysis tool for companies operating in Saudi Arabia. Upload your GOSI social insurance report and your Saudization decisions — the system analyzes your status automatically.",
      "The service classifies your workforce by profession and sector, calculates your actual Saudization percentage versus what's required, and pinpoints gaps with precision — before the Ministry of Human Resources and Social Development finds them.",
      "You receive specific AI recommendations: which professions need additional Saudization, how many hires are needed, and how to redistribute your workforce to achieve compliance.",
    ],
  },
  benefits: {
    title: "What will I get?",
    cards: [
      {
        icon: "barChart",
        title: "Instant Compliance Analysis",
        desc: "Actual vs. required Saudization percentage for every profession and sector — in seconds.",
      },
      {
        icon: "alertCircle",
        title: "Violations Identified in Detail",
        desc: "A precise list of every profession or sector falling outside compliance boundaries.",
      },
      {
        icon: "brain",
        title: "AI Recommendations to Fix Gaps",
        desc: "Practical, specific suggestions for closing Saudization gaps in each profession.",
      },
      {
        icon: "target",
        title: "Hiring Scenario Simulation",
        desc: "See how your Nitaqat status changes if you hire or terminate specific positions.",
      },
      {
        icon: "download",
        title: "Exportable Reports",
        desc: "Export your report as CSV or PDF to share with your HR team or legal advisor.",
      },
      {
        icon: "shieldCheck",
        title: "Instant Updates with New Data",
        desc: "Upload new GOSI data any time and get an updated analysis immediately.",
      },
    ],
  },
  howItWorks: {
    title: "How does it work?",
    steps: [
      {
        n: "1",
        title: "Upload Your GOSI Report and Saudization Decisions",
        desc: "Upload the GOSI index report and Saudization decisions file in Excel format — the system reads them automatically.",
      },
      {
        n: "2",
        title: "Review Your Compliance Analysis",
        desc: "See your exact status by profession and sector: compliant, violation, or below the required threshold.",
      },
      {
        n: "3",
        title: "Get Recommendations and Act",
        desc: "Receive specific AI recommendations and export the report for your HR team.",
      },
    ],
  },
  results: {
    title: "What results can you expect?",
    items: [
      "Know your real compliance status before any official audit",
      "Identify professions and sectors that need urgent action",
      "Save time spent on manual Saudization reporting",
      "Make informed hiring decisions that improve your Nitaqat standing",
      "Reduce the risk of fines and penalties related to Saudization violations",
    ],
  },
  audience: {
    title: "Who is this for?",
    cards: [
      {
        icon: "building2",
        title: "Multi-Sector Companies",
        desc: "Manage compliance across multiple sectors and professions in one place without complexity.",
      },
      {
        icon: "users",
        title: "HR Teams",
        desc: "A fast reference tool for HR specialists to track Saudization status accurately.",
      },
      {
        icon: "briefcase",
        title: "Legal Advisors & Compliance Firms",
        desc: "Accurate, exportable reports that support consulting and audit work.",
      },
    ],
  },
  why: {
    title: "Why JobAI24?",
    items: [
      "Analysis by profession and sector — not misleading aggregate numbers",
      "Specific, actionable AI recommendations",
      "Simulation tool to test hiring scenarios before executing them",
      "Professional reports ready to export and share",
      "Arabic-first interface designed for the Saudi labor market",
      "Instant update when new data is uploaded",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "What files do I need to upload?",
        a: "The GOSI social insurance index report and the Saudization decisions file — both in Excel format.",
      },
      {
        q: "Does the system handle multi-branch companies?",
        a: "Yes. You can manage more than one establishment or branch within the same account.",
      },
      {
        q: "How does the service determine compliance status?",
        a: "The system compares the actual Saudization percentage for each profession and sector to the required percentage in the Saudization decisions, and classifies as: compliant, violation, or below threshold.",
      },
      {
        q: "Is the analysis fully accurate?",
        a: "The analysis relies on the files you upload. Result accuracy depends on the accuracy of the GOSI and Saudization data provided.",
      },
      {
        q: "Is my sensitive company data secure?",
        a: "Yes. All data is processed securely in line with the highest data protection standards.",
      },
      {
        q: "Can I export the report?",
        a: "Yes. Reports are available for export as CSV and PDF.",
      },
      {
        q: "What's the difference between compliant and violation status?",
        a: "Compliant means the Saudization percentage in a profession or sector meets or exceeds the requirement. Violation means it falls below the minimum required percentage.",
      },
      {
        q: "Can I simulate the impact of new hires?",
        a: "Yes. The simulation tool lets you preview how Saudization percentages would change if you add or terminate specific employee positions.",
      },
    ],
  },
  finalCta: {
    h2: "Don't wait for an audit to find the problem",
    sub: "Check your Nitaqat status today and act before it becomes a violation.",
    cta: "Check My Compliance Status",
    note: "Instant analysis — no complexity",
  },
};

const BENEFIT_ICONS = {
  barChart: BarChart3,
  alertCircle: AlertCircle,
  brain: Brain,
  target: Target,
  download: Download,
  shieldCheck: ShieldCheck,
  trendingUp: TrendingUp,
  clock: Clock,
} as const;

const AUDIENCE_ICONS = {
  building2: Building2,
  users: Users,
  briefcase: Briefcase,
} as const;

export default async function SaudizationPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* 1. HERO */}
      <section className="bg-slate-950 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionBadge className="border-brand-500/30 bg-brand-500/10 text-brand-300">
            {t.hero.badge}
          </SectionBadge>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            {t.hero.h1}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">{t.hero.sub}</p>
          <Link
            href="/register?role=recruiter"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200/50"
          >
            {t.hero.cta}
            <Arrow className="h-4 w-4" />
          </Link>
          <div className="mt-6 flex flex-wrap justify-center gap-5">
            {t.hero.trust.map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" />
                <span className="text-xs text-slate-500">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. WHAT IS THIS */}
      <section className="bg-white py-20 md:py-24">
        <div className={`mx-auto max-w-3xl px-6 ${isAr ? "text-right" : ""}`}>
          <SectionBadge>{t.what.title}</SectionBadge>
          <div className="mt-6 space-y-4">
            {t.what.paras.map((p, i) => (
              <p key={i} className="leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BENEFIT CARDS */}
      <section className="bg-slate-50 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2
            className={`mb-10 text-2xl font-black tracking-tight text-slate-950 md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.benefits.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.benefits.cards.map((card) => {
              const Icon = BENEFIT_ICONS[card.icon as keyof typeof BENEFIT_ICONS];
              return (
                <div
                  key={card.title}
                  className={`rounded-2xl border border-white bg-white p-6 shadow-sm transition-all hover:shadow-panel ${isAr ? "text-right" : ""}`}
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ${isAr ? "mr-auto" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-bold text-slate-950">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-6">
          <h2
            className={`mb-10 text-2xl font-black tracking-tight text-slate-950 md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.howItWorks.title}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {t.howItWorks.steps.map((step) => (
              <div
                key={step.n}
                className={`flex gap-4 ${isAr ? "flex-row-reverse text-right" : ""}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-sm font-black text-white">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-bold text-slate-950">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. EXPECTED RESULTS */}
      <section className="bg-brand-600 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className={`mb-8 text-2xl font-black tracking-tight text-white md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.results.title}
          </h2>
          <ul className={`space-y-3 ${isAr ? "text-right" : ""}`}>
            {t.results.items.map((item) => (
              <li key={item} className={`flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                <span className="text-white/90">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. WHO IS IT FOR */}
      <section className="bg-slate-50 py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2
            className={`mb-10 text-2xl font-black tracking-tight text-slate-950 md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.audience.title}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {t.audience.cards.map((card) => {
              const Icon = AUDIENCE_ICONS[card.icon as keyof typeof AUDIENCE_ICONS];
              return (
                <div
                  key={card.title}
                  className={`rounded-2xl border border-slate-200 bg-white p-6 ${isAr ? "text-right" : ""}`}
                >
                  <div
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal ${isAr ? "mr-auto" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-bold text-slate-950">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. WHY JOBAI24 */}
      <section className="bg-white py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className={`mb-8 text-2xl font-black tracking-tight text-slate-950 md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.why.title}
          </h2>
          <ul className={`space-y-3 ${isAr ? "text-right" : ""}`}>
            {t.why.items.map((item) => (
              <li key={item} className={`flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                <span className="text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 8. FAQ */}
      <section className="bg-slate-50 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className={`mb-8 text-2xl font-black tracking-tight text-slate-950 md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.faq.title}
          </h2>
          <div className={`space-y-5 ${isAr ? "text-right" : ""}`}>
            {t.faq.items.map(({ q, a }) => (
              <div key={q} className="border-b border-slate-200 pb-5 last:border-0">
                <p className="font-bold text-slate-950">{q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="bg-slate-950 py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
            {t.finalCta.h2}
          </h2>
          <p className="mt-3 text-slate-400">{t.finalCta.sub}</p>
          <Link
            href="/register?role=recruiter"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200/50"
          >
            {t.finalCta.cta}
            <Arrow className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-xs text-slate-500">{t.finalCta.note}</p>
        </div>
      </section>
    </div>
  );
}
