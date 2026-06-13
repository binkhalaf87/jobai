import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  ScanSearch,
  Users,
  Send,
  BarChart3,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Brain,
  Target,
  TrendingUp,
  Building2,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Zap,
  FileText,
  Award,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "أدوات توظيف للشركات وفرق الموارد البشرية — JobAI24"
      : "Hiring Tools for HR Teams & Companies — JobAI24",
    description: isAr
      ? "وظّف أسرع وبجهد أقل. فرز جماعي للسير الذاتية، مقابلات ذكية، ومرشحون يصلونك مباشرة — كل ما تحتاجه فريق التوظيف في مكان واحد."
      : "Hire faster with less effort. Bulk resume screening, AI interviews, and qualified candidates delivered directly to you — everything your hiring team needs in one place.",
  };
}

const AR = {
  hero: {
    badge: "للشركات وفرق الموارد البشرية",
    h1: "وظّف أسرع وأدق — بجهد أقل بكثير",
    sub: "ما كان يستغرق أياماً من المراجعة اليدوية يُنجز الآن في دقائق. فرز ATS جماعي، مقابلات ذكية، ومرشحون مؤهلون يصلون إليك مباشرة — بدون إعلانات ووسطاء.",
    cta: "جرّب مجاناً للشركات",
    trust: ["بدون بطاقة ائتمانية", "إعداد في دقائق", "التزام بنظام PDPL"],
  },
  what: {
    title: "ما هذه الخدمة؟",
    paras: [
      "JobAI24 للشركات هي مجموعة متكاملة من أدوات التوظيف الذكية — مصممة لتوفير وقت فريق HR وتحسين جودة القرارات في كل مرحلة من مراحل التوظيف.",
      "من فرز السير الذاتية إلى إجراء مقابلات الفرز الأولي، إلى استقبال ملفات مرشحين مؤهلين مباشرة — كل الأدوات في لوحة تحكم واحدة يستخدمها الفريق بأكمله.",
      "النتيجة: قرارات توظيف أسرع، مرشحون ذوو جودة أعلى، وفريق HR يُركز على ما يهم حقاً — المقابلات النهائية واختيار الأفضل.",
    ],
  },
  benefits: {
    title: "ماذا يحصل فريقك؟",
    cards: [
      {
        icon: "scan",
        title: "فرز ATS جماعي فوري",
        desc: "ارفع عشرات السير دفعة واحدة واحصل على ترتيب فوري للمرشحين بالتوافق مع الوظيفة.",
      },
      {
        icon: "brain",
        title: "تقارير مُطابقة عميقة",
        desc: "تقرير GPT مفصل لكل مرشح: نقاط القوة، الفجوات، وتوصية بالتوظيف أو الرفض.",
      },
      {
        icon: "send",
        title: "مرشحون يصلونك عبر التسويق الذكي",
        desc: "استقبل ملفات مرشحين مؤهلين ومطابقين لاحتياجك مباشرة — بدون إعلانات.",
      },
      {
        icon: "award",
        title: "مقابلات فرز بالذكاء الاصطناعي",
        desc: "مقابلات آلية بأسئلة مخصصة لكل وظيفة مع تقييم فوري للإجابات.",
      },
      {
        icon: "users",
        title: "لوحة تحكم للفريق بأكمله",
        desc: "إدارة الوظائف والمرشحين والتقارير في مكان واحد — من نشر الوظيفة لاتخاذ القرار.",
      },
      {
        icon: "shield",
        title: "امتثال كامل لحماية البيانات",
        desc: "بيانات المرشحين تُعالج وفق نظام PDPL السعودي وبموافقة أصحابها.",
      },
    ],
  },
  howItWorks: {
    title: "كيف يعمل؟",
    steps: [
      {
        n: "١",
        title: "أنشئ حساب شركة وأضف وظائفك",
        desc: "أضف وصف الوظيفة ومعايير القبول — النظام يجهز نفسه للفرز.",
      },
      {
        n: "٢",
        title: "ارفع السير أو استقبل المرشحين",
        desc: "ارفع سيراً جماعياً للفرز الآلي، أو استقبل ملفات من مرشحي JobAI24 مباشرة.",
      },
      {
        n: "٣",
        title: "احصل على ترتيب، تقارير، وقرار أسرع",
        desc: "قائمة مرتبة بالمرشحين، تقارير مفصلة، وأدوات مقابلة — كل شيء في مكان واحد.",
      },
    ],
  },
  results: {
    title: "ما الذي يمكن أن تتوقعه؟",
    items: [
      "توفير ٨٠٪ من وقت الفرز اليدوي للسير الذاتية",
      "جودة مرشحين أعلى بفضل التقييم الموضوعي",
      "تقليل الوقت الكلي للتوظيف من أسابيع إلى أيام",
      "قرارات توظيف مبنية على بيانات — لا على انطباعات",
      "فريق HR يُركز على المقابلات النهائية لا على الفرز الأولي",
    ],
  },
  audience: {
    title: "من يستفيد من هذه الخدمة؟",
    cards: [
      {
        icon: "building2",
        title: "الشركات المتوسطة والكبيرة",
        desc: "إدارة عمليات توظيف ضخمة بكفاءة وسرعة لا يمكن تحقيقها يدوياً.",
      },
      {
        icon: "briefcase",
        title: "الشركات الناشئة والسريعة النمو",
        desc: "وظّف بسرعة ودقة دون الحاجة لفريق HR كبير.",
      },
      {
        icon: "users",
        title: "مختصو الموارد البشرية والتوظيف",
        desc: "أدوات تُحرّرك من الأعمال المتكررة وتُركّزك على ما يضيف قيمة حقيقية.",
      },
    ],
  },
  why: {
    title: "لماذا JobAI24 للشركات؟",
    items: [
      "الأداة الوحيدة التي تجمع الفرز والمقابلات والمرشحين في منصة واحدة",
      "مبنية على أنظمة ATS حقيقية — ليس مجرد تحليل نصي",
      "تقارير GPT مفصلة لكل مرشح بتوصية واضحة",
      "مرشحون يصلونك بشكل استباقي — لا تنتظر انتهاء الإعلان",
      "امتثال كامل لنظام PDPL السعودي",
      "واجهة عربية وإنجليزية — مناسب لفرق العمل المختلطة",
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "كم سيرة يمكن رفعها دفعة واحدة؟",
        a: "يعتمد على باقتك — يمكنك الاطلاع على الحدود الدقيقة في صفحة الأسعار.",
      },
      {
        q: "هل يمكن للفريق بأكمله استخدام الحساب؟",
        a: "نعم. حساب الشركة يدعم تعدد المستخدمين وإدارة الصلاحيات.",
      },
      {
        q: "هل تقارير الذكاء الاصطناعي دقيقة؟",
        a: "التقارير تعكس تحليلاً موضوعياً مبنياً على معايير دقيقة، وتُوصى بمراجعتها كأداة دعم وليس كقرار نهائي.",
      },
      {
        q: "كيف تصلنا ملفات المرشحين عبر التسويق الذكي؟",
        a: "مرشحو JobAI24 الذين يُطلقون حملات تسويقية يُطابق نظامنا ملفاتهم بوظائفك ويُرسلها لك مباشرة.",
      },
      {
        q: "هل بيانات المرشحين آمنة؟",
        a: "نعم. جميع البيانات تُعالج وفق نظام PDPL ولا تُشارك مع جهات خارجية.",
      },
      {
        q: "هل المقابلات الذكية تحتاج تدخلاً بشرياً؟",
        a: "لا. تُرسل الدعوة للمرشح، يُجري المقابلة، ويصلك تقرير التقييم تلقائياً.",
      },
      {
        q: "هل يمكن إضافة أكثر من شركة؟",
        a: "نعم. يمكن إدارة أكثر من منشأة أو فرع من حساب واحد.",
      },
      {
        q: "ما الفرق بين هذه الخدمة ومنصات التوظيف التقليدية؟",
        a: "منصات التوظيف تعرض السير فقط. JobAI24 يُقيّمها ويُصنّفها ويُجري مقابلات فرز أولية بشكل آلي — لتصل للقرار أسرع.",
      },
    ],
  },
  finalCta: {
    h2: "جاهز لتطوير توظيفك؟",
    sub: "أنشئ حساب شركة مجاناً وابدأ الفرز الذكي اليوم.",
    cta: "إنشاء حساب شركة",
    note: "بدون بطاقة ائتمانية",
  },
};

const EN = {
  hero: {
    badge: "For HR Teams & Companies",
    h1: "Hire Faster and More Accurately — With Far Less Effort",
    sub: "What used to take days of manual work now takes minutes. Bulk ATS screening, AI interviews, and qualified candidates delivered directly to you — no job ads, no middlemen.",
    cta: "Try Free for Companies",
    trust: ["No credit card required", "Set up in minutes", "PDPL compliant"],
  },
  what: {
    title: "What is this service?",
    paras: [
      "JobAI24 for Companies is a complete set of intelligent hiring tools — designed to save your HR team time and improve decision quality at every stage of recruitment.",
      "From resume screening to conducting initial screening interviews, to receiving qualified candidate profiles directly — all tools in one dashboard used by your entire team.",
      "The result: faster hiring decisions, higher quality candidates, and an HR team that focuses on what actually matters — final interviews and choosing the best person for the role.",
    ],
  },
  benefits: {
    title: "What does your team get?",
    cards: [
      {
        icon: "scan",
        title: "Instant Bulk ATS Screening",
        desc: "Upload dozens of resumes at once and get an instant candidate ranking by job fit.",
      },
      {
        icon: "brain",
        title: "Deep Match Reports",
        desc: "Detailed GPT report per candidate: strengths, gaps, and a clear hire/pass recommendation.",
      },
      {
        icon: "send",
        title: "Candidates Delivered via Smart Marketing",
        desc: "Receive qualified, role-matched candidate profiles directly — no job ads needed.",
      },
      {
        icon: "award",
        title: "AI Screening Interviews",
        desc: "Automated interviews with role-specific questions and instant answer scoring.",
      },
      {
        icon: "users",
        title: "Team Dashboard",
        desc: "Manage jobs, candidates, and reports in one place — from posting to decision.",
      },
      {
        icon: "shield",
        title: "Full Data Protection Compliance",
        desc: "Candidate data is processed in line with the Saudi PDPL with candidate consent.",
      },
    ],
  },
  howItWorks: {
    title: "How does it work?",
    steps: [
      {
        n: "1",
        title: "Create a Company Account and Add Your Jobs",
        desc: "Add the job description and acceptance criteria — the system prepares for screening.",
      },
      {
        n: "2",
        title: "Upload Resumes or Receive Candidates",
        desc: "Upload resumes in bulk for automated screening, or receive profiles from JobAI24 candidates directly.",
      },
      {
        n: "3",
        title: "Get Rankings, Reports, and Faster Decisions",
        desc: "A ranked candidate list, detailed reports, and interview tools — all in one place.",
      },
    ],
  },
  results: {
    title: "What results can you expect?",
    items: [
      "Save 80% of the time spent manually reviewing resumes",
      "Higher candidate quality through objective, criteria-based evaluation",
      "Reduce total hiring time from weeks to days",
      "Hiring decisions based on data — not first impressions",
      "HR team focused on final interviews — not initial sorting",
    ],
  },
  audience: {
    title: "Who is this for?",
    cards: [
      {
        icon: "building2",
        title: "Mid-Size and Large Companies",
        desc: "Manage high-volume recruitment efficiently at a speed impossible to achieve manually.",
      },
      {
        icon: "briefcase",
        title: "Startups and Fast-Growing Businesses",
        desc: "Hire fast and accurately without needing a large HR team.",
      },
      {
        icon: "users",
        title: "HR & Talent Acquisition Specialists",
        desc: "Tools that free you from repetitive tasks so you focus on what adds real value.",
      },
    ],
  },
  why: {
    title: "Why JobAI24 for Companies?",
    items: [
      "The only tool that combines screening, interviews, and candidate sourcing in one platform",
      "Built on real ATS systems — not just text parsing",
      "Detailed GPT reports per candidate with a clear recommendation",
      "Proactive candidate delivery — don't wait for job posting responses",
      "Full compliance with Saudi PDPL data protection law",
      "Arabic and English interface — suited for mixed-language teams",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "How many resumes can be uploaded at once?",
        a: "Depends on your plan — see exact limits on the pricing page.",
      },
      {
        q: "Can the whole team use the account?",
        a: "Yes. The company account supports multiple users and permission management.",
      },
      {
        q: "How accurate are the AI reports?",
        a: "Reports reflect objective analysis built on precise criteria. We recommend using them as a support tool, not as a final decision.",
      },
      {
        q: "How do candidate profiles reach us via Smart Marketing?",
        a: "JobAI24 candidates who launch outreach campaigns are matched to your open roles by our system and delivered to you directly.",
      },
      {
        q: "Is candidate data secure?",
        a: "Yes. All data is processed in line with PDPL and never shared with third parties.",
      },
      {
        q: "Do AI interviews require human involvement?",
        a: "No. An invite is sent to the candidate, they complete the interview, and you receive the evaluation report automatically.",
      },
      {
        q: "Can I manage more than one company?",
        a: "Yes. Multiple establishments or branches can be managed from a single account.",
      },
      {
        q: "What's the difference between this and traditional job platforms?",
        a: "Traditional platforms just display resumes. JobAI24 evaluates, ranks, and conducts automated screening interviews — so you reach the decision faster.",
      },
    ],
  },
  finalCta: {
    h2: "Ready to upgrade your hiring?",
    sub: "Create a free company account and start smart screening today.",
    cta: "Create Company Account",
    note: "No credit card required",
  },
};

const BENEFIT_ICONS = {
  scan: ScanSearch,
  brain: Brain,
  send: Send,
  award: Award,
  users: Users,
  shield: ShieldCheck,
  chart: BarChart3,
  clock: Clock,
  target: Target,
  trending: TrendingUp,
  zap: Zap,
  file: FileText,
} as const;

const AUDIENCE_ICONS = {
  building2: Building2,
  briefcase: Briefcase,
  users: Users,
} as const;

export default async function ForHRPage() {
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
