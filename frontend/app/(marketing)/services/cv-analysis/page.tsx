import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  FileSearch,
  CheckCircle2,
  AlertCircle,
  Target,
  Zap,
  Clock,
  TrendingUp,
  Shield,
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "تحليل السيرة الذاتية وفحص ATS — JobAI24"
      : "CV Analysis & ATS Check — JobAI24",
    description: isAr
      ? "اكتشف لماذا تُرفض سيرتك الذاتية قبل أن يراها أحد. تحليل فوري بالذكاء الاصطناعي يكشف نقاط الضعف ويوجهك لتحسينها وزيادة فرص المقابلات."
      : "Find out exactly why your resume is getting rejected before a human ever sees it. AI-powered ATS analysis reveals gaps and shows you how to fix them for more interviews.",
  };
}

const AR = {
  hero: {
    badge: "تحليل السيرة الذاتية · فحص ATS",
    h1: "اكتشف لماذا تُرفض سيرتك — وأصلحها قبل التقديم",
    sub: "٧٥٪ من السير الذاتية تُحذف تلقائياً قبل أن يراها أي مسؤول توظيف. خلال ٣٠ ثانية، يخبرك JobAI24 بالسبب الحقيقي — ويوجهك لإصلاحه.",
    cta: "ارفع سيرتك وابدأ التحليل",
    trust: ["بدون بطاقة ائتمانية", "نتائج فورية", "بدون تثبيت أي برنامج"],
  },
  what: {
    title: "ما هذه الخدمة؟",
    paras: [
      "تحليل السيرة الذاتية هو فحص شامل يقارن سيرتك الذاتية بمعايير أنظمة تتبع المتقدمين (ATS) التي تستخدمها معظم الشركات لترشيح المتقدمين تلقائياً. إذا لم تجتز هذه الأنظمة، لن تصل سيرتك إلى يد أي مسؤول توظيف.",
      "تُحلل الخدمة سيرتك مقابل أكثر من ٥٠ معياراً: التنسيق، الكلمات المفتاحية، الهيكل، المحتوى، واكتمال البيانات. تحصل على درجة توافق واضحة تشرح لك بالضبط أين تقف.",
      "إذا أضفت وصف الوظيفة التي تتقدم إليها، يقارن النظام سيرتك بالوظيفة مباشرة ويكشف لك الكلمات المفتاحية المطلوبة التي تفتقدها — وهذا ما يُحدد فرصك في المرور.",
    ],
  },
  benefits: {
    title: "ماذا ستحصل؟",
    cards: [
      {
        icon: "target",
        title: "درجة ATS فورية",
        desc: "رقم واضح من ١٠٠ يخبرك أين سيرتك الذاتية فعلاً.",
      },
      {
        icon: "alertCircle",
        title: "نقاط الرفض بالتفصيل",
        desc: "قائمة دقيقة بكل سبب يجعل الأنظمة تتجاهل سيرتك.",
      },
      {
        icon: "fileSearch",
        title: "تحليل مطابقة الوظيفة",
        desc: "قارن سيرتك بالوظيفة المستهدفة واعرف الفجوة بالضبط.",
      },
      {
        icon: "checkCircle",
        title: "الكلمات المفتاحية الناجحة والمفقودة",
        desc: "ما الكلمات التي تملكها وما الذي يجب إضافته لتجتاز الفلترة.",
      },
      {
        icon: "zap",
        title: "توصيات تحسين فورية",
        desc: "خطوات عملية محددة لرفع درجتك وزيادة فرصك.",
      },
      {
        icon: "trendingUp",
        title: "نتيجة شاملة متعددة المعايير",
        desc: "تقييم متكامل: المحتوى، التنسيق، الاكتمال، والمطابقة.",
      },
    ],
  },
  howItWorks: {
    title: "كيف يعمل؟",
    steps: [
      {
        n: "١",
        title: "ارفع سيرتك الذاتية",
        desc: "ارفع ملف PDF أو Word في ثوانٍ — النظام يقرأها تلقائياً.",
      },
      {
        n: "٢",
        title: "أضف وصف الوظيفة (اختياري)",
        desc: "الصق وصف الوظيفة للحصول على تحليل مطابقة مخصص لكل فرصة.",
      },
      {
        n: "٣",
        title: "استلم تقريرك الكامل",
        desc: "خلال ٣٠ ثانية تحصل على درجتك ونقاط التحسين والكلمات المفتاحية.",
      },
    ],
  },
  results: {
    title: "ما الذي يمكن أن تتوقعه؟",
    items: [
      "معرفة الأسباب الدقيقة لرفض سيرتك الذاتية",
      "تحديد الكلمات المفتاحية المطلوبة في مجالك",
      "فهم ما يميزك عن المنافسين في نفس الوظيفة",
      "تقليل الوقت الضائع في التقديم لوظائف غير متوافقة",
      "زيادة ظهور سيرتك لدى مسؤولي التوظيف",
    ],
  },
  audience: {
    title: "من يستفيد من هذه الخدمة؟",
    cards: [
      {
        icon: "graduationCap",
        title: "الخريجون الجدد",
        desc: "لا تبدأ رحلتك المهنية بسيرة ذاتية لا تجتاز الفلترة الأولى.",
      },
      {
        icon: "briefcase",
        title: "المحترفون الباحثون عن تغيير",
        desc: "سيرتك القديمة قد لا تتوافق مع متطلبات سوق العمل الحديث.",
      },
      {
        icon: "users",
        title: "المتقدمون لوظائف متعددة",
        desc: "اعرف لكل وظيفة ما يجب تعديله قبل التقديم.",
      },
    ],
  },
  why: {
    title: "لماذا JobAI24؟",
    items: [
      "تحليل مبني على أكثر من ٥٠ معياراً حقيقياً تستخدمها أنظمة ATS",
      "مقارنة مباشرة بين سيرتك والوظيفة المستهدفة",
      "نتائج فورية — لا انتظار ولا طوابير",
      "واجهة بالعربية والإنجليزية — سهلة الاستخدام دون أي خبرة تقنية",
      "مناسب لسوق العمل السعودي والخليجي تحديداً",
      "تقارير قابلة للتصدير ومشاركتها مع مستشارك المهني",
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "ما صيغ الملفات المدعومة؟",
        a: "يدعم النظام ملفات PDF وWord (.docx). الـ PDF هو الأفضل للتحليل الدقيق.",
      },
      {
        q: "هل أحتاج لخبرة تقنية؟",
        a: "لا. كل ما تحتاجه هو رفع سيرتك — التحليل يحدث تلقائياً.",
      },
      {
        q: "ما الفرق بين تحليل ATS وتحليل المطابقة؟",
        a: "تحليل ATS يفحص سيرتك مقابل معايير عامة. تحليل المطابقة يقارنها بوظيفة محددة — فكله أكثر دقة.",
      },
      {
        q: "هل بياناتي آمنة؟",
        a: "نعم. سيرتك الذاتية تُعالج بشكل آمن ولا تُشارك مع جهات خارجية دون إذنك.",
      },
      {
        q: "كم من الوقت يستغرق التحليل؟",
        a: "لا أكثر من ٣٠ ثانية في معظم الحالات.",
      },
      {
        q: "هل يمكنني تحليل عدة سير ذاتية؟",
        a: "نعم، يمكنك رفع وتحليل أكثر من سيرة ذاتية ومقارنتها.",
      },
      {
        q: "هل نتائج التحليل دقيقة؟",
        a: "التحليل مبني على خوارزميات مشابهة لتلك التي تستخدمها أنظمة ATS الفعلية، لكن النتيجة الحقيقية تعتمد على قرار المسؤول البشري أيضاً.",
      },
      {
        q: "ماذا أفعل بعد التحليل؟",
        a: "اتبع التوصيات لتحسين سيرتك، ثم يمكنك الانتقال لخدمة تحسين السيرة الذاتية لإعادة كتابتها بالذكاء الاصطناعي.",
      },
    ],
  },
  finalCta: {
    h2: "جاهز لمعرفة سبب رفض سيرتك؟",
    sub: "ارفعها الآن وخلال ثوانٍ تعرف أين المشكلة — وكيف تحلها.",
    cta: "ارفع سيرتك وابدأ التحليل",
    note: "بدون بطاقة ائتمانية",
  },
};

const EN = {
  hero: {
    badge: "CV Analysis · ATS Check",
    h1: "Find Out Why Your Resume Gets Rejected — And Fix It",
    sub: "75% of resumes are automatically discarded before a human ever sees them. In 30 seconds, JobAI24 tells you exactly why — and what to change to get more interviews.",
    cta: "Upload Your CV and Get Your Analysis",
    trust: ["No credit card required", "Instant results", "No software to install"],
  },
  what: {
    title: "What is this service?",
    paras: [
      "CV Analysis is a comprehensive check that compares your resume against the criteria used by Applicant Tracking Systems (ATS) — the software most companies use to automatically filter out candidates. If your resume doesn't pass these systems, no human will ever read it.",
      "The service analyzes your resume against 50+ criteria: formatting, keywords, structure, content quality, and completeness. You get a clear score and a plain-language explanation of where you stand.",
      "Add a specific job description and the system compares your resume directly to that role — revealing the exact keywords you're missing, which is what determines your chances of getting through.",
    ],
  },
  benefits: {
    title: "What will I get?",
    cards: [
      {
        icon: "target",
        title: "Instant ATS Score",
        desc: "A clear score out of 100 that tells you exactly where your resume stands.",
      },
      {
        icon: "alertCircle",
        title: "Rejection Reasons in Detail",
        desc: "A precise list of every reason ATS systems are filtering out your resume.",
      },
      {
        icon: "fileSearch",
        title: "Job Match Analysis",
        desc: "Compare your resume to a target job and see the exact gap.",
      },
      {
        icon: "checkCircle",
        title: "Matched & Missing Keywords",
        desc: "Which keywords you have and which ones you must add to pass the filter.",
      },
      {
        icon: "zap",
        title: "Actionable Fix Suggestions",
        desc: "Specific, practical steps to raise your score and improve your chances.",
      },
      {
        icon: "trendingUp",
        title: "Multi-Criteria Overall Score",
        desc: "A complete assessment across content, formatting, completeness, and match.",
      },
    ],
  },
  howItWorks: {
    title: "How does it work?",
    steps: [
      {
        n: "1",
        title: "Upload Your Resume",
        desc: "Upload a PDF or Word file in seconds — the system reads it automatically.",
      },
      {
        n: "2",
        title: "Add a Job Description (Optional)",
        desc: "Paste a job description to get a tailored match analysis for that specific role.",
      },
      {
        n: "3",
        title: "Get Your Full Report",
        desc: "Within 30 seconds you receive your score, improvement points, and keyword gaps.",
      },
    ],
  },
  results: {
    title: "What results can you expect?",
    items: [
      "Know the exact reasons your resume is being rejected",
      "Identify the keywords employers are looking for in your field",
      "Understand what sets you apart from other candidates",
      "Stop wasting time applying to roles your resume doesn't match",
      "Increase your visibility with hiring managers",
    ],
  },
  audience: {
    title: "Who is this for?",
    cards: [
      {
        icon: "graduationCap",
        title: "Recent Graduates",
        desc: "Don't start your career with a resume that gets filtered out on the first pass.",
      },
      {
        icon: "briefcase",
        title: "Professionals Changing Jobs",
        desc: "Your old resume may not align with what today's employers are actually looking for.",
      },
      {
        icon: "users",
        title: "Active Job Applicants",
        desc: "Know what to change for each job before you apply — not after rejection.",
      },
    ],
  },
  why: {
    title: "Why JobAI24?",
    items: [
      "Analysis built on 50+ real ATS criteria used by actual hiring systems",
      "Direct comparison between your resume and your target job",
      "Instant results — no waiting, no queues",
      "Fully bilingual (Arabic & English) — no technical knowledge needed",
      "Built for the Saudi and GCC job market specifically",
      "Exportable reports you can share with a career coach or mentor",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "What file formats are supported?",
        a: "The system supports PDF and Word (.docx) files. PDF gives the most accurate analysis.",
      },
      {
        q: "Do I need any technical skills?",
        a: "None at all. Just upload your resume — the analysis runs automatically.",
      },
      {
        q: "What's the difference between ATS analysis and job match analysis?",
        a: "ATS analysis checks your resume against general criteria. Job match analysis compares it to a specific job posting — which is more precise and actionable.",
      },
      {
        q: "Is my data secure?",
        a: "Yes. Your resume is processed securely and never shared with third parties without your consent.",
      },
      {
        q: "How long does the analysis take?",
        a: "No more than 30 seconds in most cases.",
      },
      {
        q: "Can I analyze multiple resumes?",
        a: "Yes. You can upload and analyze more than one resume and compare them.",
      },
      {
        q: "How accurate are the results?",
        a: "The analysis uses algorithms similar to real ATS systems, but the final hiring decision always involves a human element too.",
      },
      {
        q: "What should I do after the analysis?",
        a: "Follow the improvement recommendations, then use the Resume Enhancement service to have AI rewrite your resume with the fixes applied.",
      },
    ],
  },
  finalCta: {
    h2: "Ready to find out why your resume is being rejected?",
    sub: "Upload it now and in seconds you'll know the problem — and how to fix it.",
    cta: "Upload Your CV and Start Your Analysis",
    note: "No credit card required",
  },
};

const BENEFIT_ICONS = {
  target: Target,
  alertCircle: AlertCircle,
  fileSearch: FileSearch,
  checkCircle: CheckCircle2,
  zap: Zap,
  trendingUp: TrendingUp,
} as const;

const AUDIENCE_ICONS = {
  graduationCap: GraduationCap,
  briefcase: Briefcase,
  users: Users,
} as const;

export default async function CvAnalysisPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div dir={dir}>
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
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
          >
            {t.hero.cta}
            <Arrow className="h-4 w-4" />
          </Link>
          <div className={`mt-6 flex flex-wrap justify-center gap-5`}>
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
