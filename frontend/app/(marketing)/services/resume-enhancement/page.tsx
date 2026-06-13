import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  PenLine,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
  Clock,
  TrendingUp,
  FileText,
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  LayoutTemplate,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "تحسين السيرة الذاتية بالذكاء الاصطناعي — JobAI24"
      : "AI Resume Enhancement — JobAI24",
    description: isAr
      ? "حوّل سيرتك الذاتية العادية إلى سيرة احترافية تجتاز أنظمة ATS وتُقنع مسؤولي التوظيف. إعادة كتابة ذكية فورية لكل قسم في سيرتك."
      : "Transform your ordinary resume into a professional one that passes ATS systems and impresses hiring managers. Instant AI-powered rewriting of every section.",
  };
}

const AR = {
  hero: {
    badge: "تحسين السيرة الذاتية · إعادة كتابة بالذكاء الاصطناعي",
    h1: "سيرة ذاتية تُقنع المسؤولين وتتجاوز ATS",
    sub: "سيرتك الحالية قد تكون تُخفي قدراتك الحقيقية. JobAI24 يُعيد كتابتها باحترافية — جمل قوية، كلمات مفتاحية مناسبة، وتنسيق يُبرزك في ثوانٍ.",
    cta: "حسّن سيرتي الذاتية الآن",
    trust: ["بدون بطاقة ائتمانية", "نتائج فورية", "٣ بدائل لكل جملة"],
  },
  what: {
    title: "ما هذه الخدمة؟",
    paras: [
      "تحسين السيرة الذاتية هو أكثر من مجرد تصحيح نحوي. الخدمة تحلل كل قسم في سيرتك — الخبرات، المهارات، التعليم — وتُعيد صياغته بلغة احترافية تستهدف ما يبحث عنه أصحاب العمل فعلاً.",
      "لكل جملة أو إنجاز في سيرتك، يقترح الذكاء الاصطناعي ثلاثة بدائل مُحسّنة. أنت تختار ما يناسبك — النظام لا يستبدل صوتك، بل يجعله أقوى.",
      "النتيجة: سيرة ذاتية تجتاز فلاتر ATS، تبرز وسط المنافسين، وتدفع مسؤول التوظيف لدعوتك للمقابلة.",
    ],
  },
  benefits: {
    title: "ماذا ستحصل؟",
    cards: [
      {
        icon: "penLine",
        title: "٣ بدائل لكل جملة",
        desc: "اختر الصياغة التي تعبّر عنك أفضل من بين ٣ خيارات مُحسّنة.",
      },
      {
        icon: "target",
        title: "كلمات مفتاحية مُدمجة",
        desc: "يُضاف تلقائياً الكلمات التي تبحث عنها أنظمة ATS في مجالك.",
      },
      {
        icon: "sparkles",
        title: "لغة إنجازات — لا مهام",
        desc: "تحويل الواجبات الوظيفية إلى إنجازات قابلة للقياس تلفت الانتباه.",
      },
      {
        icon: "layoutTemplate",
        title: "هيكل احترافي واضح",
        desc: "ترتيب الأقسام بالطريقة التي تُفضلها أنظمة الفرز الحديثة.",
      },
      {
        icon: "zap",
        title: "تحسين فوري — لا انتظار",
        desc: "تحصل على المقترحات في ثوانٍ، وتطبقها بنقرة واحدة.",
      },
      {
        icon: "trendingUp",
        title: "رفع درجة ATS بشكل ملموس",
        desc: "سيرتك المُحسّنة تحقق درجات أعلى في تحليل ATS التالي.",
      },
    ],
  },
  howItWorks: {
    title: "كيف يعمل؟",
    steps: [
      {
        n: "١",
        title: "ارفع سيرتك الحالية",
        desc: "ارفع ملف PDF أو Word — النظام يقرأ كل قسم ويفهم محتواه.",
      },
      {
        n: "٢",
        title: "راجع المقترحات",
        desc: "لكل جملة تحصل على ٣ بدائل مُحسّنة — اختر أو اجمع كما تشاء.",
      },
      {
        n: "٣",
        title: "صدّر سيرتك المُحسّنة",
        desc: "احفظ النسخة الجديدة واستخدمها في تقديماتك مباشرة.",
      },
    ],
  },
  results: {
    title: "ما الذي يمكن أن تتوقعه؟",
    items: [
      "سيرة ذاتية أكثر احترافية وتأثيراً في أقل من دقائق",
      "درجة ATS أعلى مما كانت عليه قبل التحسين",
      "لغة إنجازات تُبرز قيمتك الحقيقية لا مجرد عنوان وظيفتك",
      "توافق أفضل مع الوظائف التي تتقدم إليها",
      "ثقة أكبر عند إرسال سيرتك لأي جهة",
    ],
  },
  audience: {
    title: "من يستفيد من هذه الخدمة؟",
    cards: [
      {
        icon: "graduationCap",
        title: "الخريجون الجدد",
        desc: "حوّل خبراتك المحدودة إلى سيرة ذاتية تعكس قدراتك الحقيقية.",
      },
      {
        icon: "briefcase",
        title: "الباحثون عن ترقية أو تغيير",
        desc: "سيرتك القديمة لا تعكس ما أصبحت عليه — حان وقت تحديثها.",
      },
      {
        icon: "users",
        title: "من يتقدم لشركات كبرى",
        desc: "المنافسة شديدة — كل كلمة في سيرتك تصنع الفرق.",
      },
    ],
  },
  why: {
    title: "لماذا JobAI24؟",
    items: [
      "اقتراحات مبنية على ما يبحث عنه أصحاب العمل فعلاً في السوق السعودي",
      "أنت تحتفظ بصوتك — النظام يُحسّن لا يستبدل",
      "٣ بدائل لكل جملة — مرونة حقيقية في الاختيار",
      "متكامل مع تحليل ATS — اعرف تأثير التحسين فوراً",
      "دعم كامل للغتين العربية والإنجليزية",
      "لا تحتاج خبرة في الكتابة — الذكاء الاصطناعي يتولى الصياغة",
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "هل سيبدو الذكاء الاصطناعي واضحاً في سيرتي؟",
        a: "لا. المقترحات مبنية على محتوى سيرتك الأصلية — تبدو طبيعية واحترافية وليس مولّدة آلياً.",
      },
      {
        q: "هل يمكنني رفض المقترحات؟",
        a: "بالطبع. أنت تتحكم في كل تغيير — يمكنك قبول أو رفض أي مقترح.",
      },
      {
        q: "هل يعمل مع السير الذاتية بالعربية؟",
        a: "نعم. الخدمة تدعم السير الذاتية باللغة العربية والإنجليزية.",
      },
      {
        q: "ما الفرق بين التحسين والتحليل؟",
        a: "التحليل يكشف المشاكل. التحسين يصلحها فعلياً بإعادة كتابة المحتوى.",
      },
      {
        q: "هل بياناتي آمنة؟",
        a: "نعم. سيرتك تُعالج بشكل آمن ولا تُشارك مع أي جهة دون موافقتك.",
      },
      {
        q: "كم من الوقت يستغرق التحسين؟",
        a: "المقترحات تظهر في ثوانٍ. مراجعة كل القسم يستغرق عادة أقل من ١٠ دقائق.",
      },
      {
        q: "هل يمكنني تحسين عدة نسخ من سيرتي لوظائف مختلفة؟",
        a: "نعم. يمكنك تخصيص نسخة مختلفة لكل نوع من الوظائف التي تتقدم إليها.",
      },
      {
        q: "ماذا أفعل بعد التحسين؟",
        a: "يمكنك استخدام خدمة التسويق الذكي لإرسال سيرتك المُحسّنة مباشرة لمسؤولي التوظيف.",
      },
    ],
  },
  finalCta: {
    h2: "سيرتك تستحق أن تُقرأ — لا أن تُحذف",
    sub: "ارفع سيرتك الآن واحصل على مقترحات تحسين فورية مجاناً.",
    cta: "حسّن سيرتي الذاتية",
    note: "بدون بطاقة ائتمانية",
  },
};

const EN = {
  hero: {
    badge: "Resume Enhancement · AI-Powered Rewriting",
    h1: "A Resume That Gets Past ATS and Impresses Hiring Managers",
    sub: "Your current resume may be hiding your real potential. JobAI24 rewrites it professionally — stronger language, the right keywords, and formatting that gets you noticed in seconds.",
    cta: "Enhance My Resume Now",
    trust: ["No credit card required", "Instant suggestions", "3 alternatives per sentence"],
  },
  what: {
    title: "What is this service?",
    paras: [
      "Resume Enhancement goes beyond grammar fixes. The service analyzes every section of your resume — experience, skills, education — and rewrites it with professional language that targets what employers are actually looking for.",
      "For every sentence or achievement in your resume, the AI suggests three improved alternatives. You choose what fits — the system doesn't replace your voice, it makes it stronger.",
      "The result: a resume that passes ATS filters, stands out from other candidates, and motivates hiring managers to invite you for an interview.",
    ],
  },
  benefits: {
    title: "What will I get?",
    cards: [
      {
        icon: "penLine",
        title: "3 Alternatives Per Sentence",
        desc: "Choose the wording that represents you best from 3 improved options.",
      },
      {
        icon: "target",
        title: "Embedded Keywords",
        desc: "The keywords ATS systems look for in your field are automatically integrated.",
      },
      {
        icon: "sparkles",
        title: "Achievement Language — Not Tasks",
        desc: "Job duties become measurable accomplishments that catch the eye.",
      },
      {
        icon: "layoutTemplate",
        title: "Professional, Clear Structure",
        desc: "Sections are ordered the way modern screening systems prefer.",
      },
      {
        icon: "zap",
        title: "Instant Improvements — No Wait",
        desc: "Get suggestions in seconds and apply them with a single click.",
      },
      {
        icon: "trendingUp",
        title: "Measurably Higher ATS Score",
        desc: "Your enhanced resume scores significantly higher on the next ATS check.",
      },
    ],
  },
  howItWorks: {
    title: "How does it work?",
    steps: [
      {
        n: "1",
        title: "Upload Your Current Resume",
        desc: "Upload a PDF or Word file — the system reads every section and understands the content.",
      },
      {
        n: "2",
        title: "Review the Suggestions",
        desc: "For each sentence you get 3 enhanced alternatives — choose, mix, or modify as you like.",
      },
      {
        n: "3",
        title: "Export Your Enhanced Resume",
        desc: "Save the new version and use it in your applications immediately.",
      },
    ],
  },
  results: {
    title: "What results can you expect?",
    items: [
      "A more professional, impactful resume in minutes",
      "A higher ATS score than your resume had before enhancement",
      "Achievement language that shows your real value — not just your job title",
      "Better alignment with the jobs you're applying for",
      "More confidence every time you send your resume",
    ],
  },
  audience: {
    title: "Who is this for?",
    cards: [
      {
        icon: "graduationCap",
        title: "Recent Graduates",
        desc: "Turn limited experience into a resume that reflects your real potential.",
      },
      {
        icon: "briefcase",
        title: "Professionals Seeking a Promotion or Change",
        desc: "Your old resume doesn't reflect who you've become — it's time to update it.",
      },
      {
        icon: "users",
        title: "Applicants Targeting Top Companies",
        desc: "Competition is fierce — every word in your resume makes a difference.",
      },
    ],
  },
  why: {
    title: "Why JobAI24?",
    items: [
      "Suggestions built on what employers in the Saudi market are actually looking for",
      "You keep your voice — the system improves, not replaces",
      "3 alternatives per sentence — real flexibility in your choices",
      "Integrated with ATS analysis — see the impact of improvements instantly",
      "Full bilingual support for Arabic and English resumes",
      "No writing experience needed — the AI handles the crafting",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "Will the AI sound obvious in my resume?",
        a: "No. Suggestions are built on your original resume content — they sound natural and professional, not machine-generated.",
      },
      {
        q: "Can I reject suggestions?",
        a: "Absolutely. You control every change — you can accept or reject any suggestion.",
      },
      {
        q: "Does it work with Arabic resumes?",
        a: "Yes. The service supports both Arabic and English resumes.",
      },
      {
        q: "What's the difference between Enhancement and Analysis?",
        a: "Analysis reveals the problems. Enhancement actually fixes them by rewriting the content.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. Your resume is processed securely and never shared with any third party without your consent.",
      },
      {
        q: "How long does enhancement take?",
        a: "Suggestions appear in seconds. Reviewing all sections typically takes less than 10 minutes.",
      },
      {
        q: "Can I create multiple versions for different jobs?",
        a: "Yes. You can customize a different version for each type of role you're applying to.",
      },
      {
        q: "What should I do after enhancement?",
        a: "Use the Smart CV Marketing service to send your enhanced resume directly to hiring managers.",
      },
    ],
  },
  finalCta: {
    h2: "Your resume deserves to be read — not filtered out",
    sub: "Upload your resume now and get instant improvement suggestions for free.",
    cta: "Enhance My Resume",
    note: "No credit card required",
  },
};

const BENEFIT_ICONS = {
  penLine: PenLine,
  target: Target,
  sparkles: Sparkles,
  layoutTemplate: LayoutTemplate,
  zap: Zap,
  trendingUp: TrendingUp,
  fileText: FileText,
} as const;

const AUDIENCE_ICONS = {
  graduationCap: GraduationCap,
  briefcase: Briefcase,
  users: Users,
} as const;

export default async function ResumeEnhancementPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* 1. HERO */}
      <section className="bg-slate-950 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionBadge className="border-teal/30 bg-teal/10 text-teal">
            {t.hero.badge}
          </SectionBadge>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            {t.hero.h1}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">{t.hero.sub}</p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
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
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal ${isAr ? "mr-auto" : ""}`}
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal text-sm font-black text-white">
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
      <section className="bg-teal py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className={`mb-8 text-2xl font-black tracking-tight text-white md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.results.title}
          </h2>
          <ul className={`space-y-3 ${isAr ? "text-right" : ""}`}>
            {t.results.items.map((item) => (
              <li key={item} className={`flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white/70" />
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
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ${isAr ? "mr-auto" : ""}`}
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
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
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
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
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
