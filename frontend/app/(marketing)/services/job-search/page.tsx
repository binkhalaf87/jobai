import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  Search,
  CheckCircle2,
  Target,
  Star,
  BarChart3,
  Bookmark,
  Zap,
  TrendingUp,
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Filter,
  Brain,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "البحث الذكي عن الوظائف — JobAI24"
      : "AI Job Search — JobAI24",
    description: isAr
      ? "ابحث عن وظائف تناسب مهاراتك الحقيقية — لا مجرد عناوين. يُقيّم الذكاء الاصطناعي مدى توافق كل وظيفة مع سيرتك الذاتية ويُحدد الكلمات المفتاحية المفقودة قبل التقديم."
      : "Find jobs that actually match your skills — not just your title. AI scores every posting against your resume and identifies missing keywords before you apply.",
  };
}

const AR = {
  hero: {
    badge: "البحث الذكي عن الوظائف",
    h1: "وظائف تناسب مهاراتك — وليس مجرد عناوين",
    sub: "البحث العادي عن الوظائف يُعطيك نتائج كثيرة — لكنها غالباً غير مناسبة. JobAI24 يُقيّم كل وظيفة مقابل سيرتك الذاتية ويُريك التوافق الحقيقي بينك وبين كل فرصة.",
    cta: "ابحث عن وظائف تناسبك",
    trust: ["تقييم توافق فوري", "كلمات مفتاحية مطلوبة لكل وظيفة", "حفظ الوظائف للمراجعة لاحقاً"],
  },
  what: {
    title: "ما هذه الخدمة؟",
    paras: [
      "البحث الذكي عن الوظائف هو أكثر من مجرد محرك بحث. بعد رفع سيرتك الذاتية، يُقيّم النظام كل وظيفة تظهر في نتائجك ويُعطيها درجة توافق مع مهاراتك وخبراتك.",
      "لكل وظيفة، تشاهد الكلمات المفتاحية التي تمتلكها والتي تفتقدها — وهذا يُساعدك على تحديد الوظائف الأجدر بالتقديم ومعرفة ما يجب تحسينه في سيرتك قبل الإرسال.",
      "يمكنك تصفية النتائج بالموقع ونوع التوظيف وتاريخ النشر — ثم حفظ الوظائف التي تهمك لمراجعتها والتقديم عليها لاحقاً.",
    ],
  },
  benefits: {
    title: "ماذا ستحصل؟",
    cards: [
      {
        icon: "target",
        title: "درجة توافق لكل وظيفة",
        desc: "رقم واضح يُخبرك كم بالمئة تتوافق سيرتك مع هذه الوظيفة تحديداً.",
      },
      {
        icon: "brain",
        title: "كلمات مفتاحية مطابقة ومفقودة",
        desc: "ما الكلمات التي تمتلكها وما الذي يجب إضافته قبل التقديم.",
      },
      {
        icon: "filter",
        title: "تصفية دقيقة للنتائج",
        desc: "صفّ حسب الموقع ونوع التوظيف والتاريخ — اوصل للوظيفة المناسبة بسرعة.",
      },
      {
        icon: "bookmark",
        title: "حفظ الوظائف",
        desc: "احفظ الوظائف المهمة وراجعها في أي وقت — لا تُفوّت فرصة.",
      },
      {
        icon: "star",
        title: "رؤى ذكاء اصطناعي لكل وظيفة",
        desc: "تحليل عميق لمدى ملاءمتك لكل وظيفة بمحاور محددة.",
      },
      {
        icon: "zap",
        title: "نتائج من أكبر المنصات العالمية",
        desc: "وظائف مُجمَّعة من كبرى منصات التوظيف في المنطقة والعالم.",
      },
    ],
  },
  howItWorks: {
    title: "كيف يعمل؟",
    steps: [
      {
        n: "١",
        title: "ارفع سيرتك وابحث",
        desc: "أدخل عنوان الوظيفة والموقع — والنظام يجلب النتائج ويُقيّمها مقابل سيرتك.",
      },
      {
        n: "٢",
        title: "راجع درجات التوافق",
        desc: "شاهد كل وظيفة مع درجتها وملخص الكلمات المفتاحية المطابقة والمفقودة.",
      },
      {
        n: "٣",
        title: "قدّم بثقة أو حسّن سيرتك أولاً",
        desc: "إذا كانت درجة التوافق عالية — قدّم. إذا كانت منخفضة — أضف الكلمات المفقودة أولاً.",
      },
    ],
  },
  results: {
    title: "ما الذي يمكن أن تتوقعه؟",
    items: [
      "توقف عن التقديم لوظائف لا تناسبك — ركز على الفرص الحقيقية",
      "معرفة الكلمات المفتاحية التي تفتقدها قبل كل تقديم",
      "توفير وقت البحث العشوائي في عشرات المنصات",
      "زيادة احتمالية المرور عبر فلاتر ATS في كل تقديم",
      "قرارات تقديم مبنية على بيانات — لا تخمين",
    ],
  },
  audience: {
    title: "من يستفيد من هذه الخدمة؟",
    cards: [
      {
        icon: "graduationCap",
        title: "الخريجون المبتدئون",
        desc: "اعرف أي الوظائف تناسب مؤهلاتك الحالية وأيها يحتاج خبرة إضافية.",
      },
      {
        icon: "briefcase",
        title: "المحترفون الباحثون عن تغيير",
        desc: "قيّم توافقك مع الوظائف الجديدة قبل إرسال سيرتك.",
      },
      {
        icon: "users",
        title: "المتقدمون لوظائف متعددة",
        desc: "نظّم بحثك واحفظ الفرص المهمة — لا تُدير كل شيء يدوياً.",
      },
    ],
  },
  why: {
    title: "لماذا JobAI24؟",
    items: [
      "تقييم التوافق مبني على سيرتك الفعلية — لا على المسمى الوظيفي فقط",
      "كلمات مفتاحية مطابقة ومفقودة لكل وظيفة",
      "نتائج من منصات توظيف عالمية متعددة في مكان واحد",
      "حفظ وتنظيم الوظائف المفضلة بسهولة",
      "تكامل مباشر مع خدمة تحسين السيرة الذاتية",
      "واجهة عربية وإنجليزية — مناسب لكل باحث عن عمل في المنطقة",
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "من أين تأتي الوظائف؟",
        a: "الوظائف تُجمع من كبرى منصات التوظيف العالمية والإقليمية.",
      },
      {
        q: "هل يجب رفع سيرتي الذاتية لاستخدام البحث؟",
        a: "لا. يمكنك البحث بدون سيرة ذاتية، لكن التقييم وتحليل الكلمات المفتاحية يتطلبان ربط سيرتك.",
      },
      {
        q: "كيف تُحسب درجة التوافق؟",
        a: "النظام يُقارن مهاراتك وخبراتك وكلماتك المفتاحية مع متطلبات الوظيفة ويحسب درجة مطابقة.",
      },
      {
        q: "هل يمكنني ربط أكثر من سيرة ذاتية؟",
        a: "نعم. يمكنك اختيار أي سيرة من سيرك المرفوعة لتقييم التوافق.",
      },
      {
        q: "هل تُظهر الوظائف في المملكة العربية السعودية؟",
        a: "نعم. يمكنك تصفية النتائج بالموقع الجغرافي بما في ذلك المدن السعودية.",
      },
      {
        q: "ما معنى الكلمات المفتاحية المفقودة؟",
        a: "هي الكلمات والمهارات المطلوبة في الوظيفة التي لا تظهر في سيرتك حالياً — إضافتها يرفع درجة توافقك.",
      },
      {
        q: "هل يمكنني التقديم مباشرة من المنصة؟",
        a: "تُعاد توجيهك لصفحة التقديم على المنصة الأصلية لإكمال الطلب.",
      },
      {
        q: "ما الفرق بين هذه الخدمة وبحث Indeed أو LinkedIn؟",
        a: "الفرق الجوهري هو تقييم التوافق الشخصي — هذه المنصات تُظهر وظائف عامة، JobAI24 يُخبرك أيها يناسبك تحديداً.",
      },
    ],
  },
  finalCta: {
    h2: "ابحث بذكاء — قدّم بثقة",
    sub: "ارفع سيرتك وابدأ بالبحث عن الوظائف التي تناسبك فعلاً.",
    cta: "ابدأ البحث الذكي",
    note: "بدون بطاقة ائتمانية",
  },
};

const EN = {
  hero: {
    badge: "AI-Powered Job Search",
    h1: "Find Jobs That Match Your Skills, Not Just Your Title",
    sub: "Regular job search gives you lots of results — most of them wrong for you. JobAI24 scores every job posting against your actual resume and shows you your real fit with each opportunity.",
    cta: "Find Jobs That Fit You",
    trust: ["Instant match scoring", "Keywords required per job", "Save jobs to review later"],
  },
  what: {
    title: "What is this service?",
    paras: [
      "AI Job Search is more than a search engine. After uploading your resume, the system evaluates every job in your results and assigns it a match score based on your actual skills and experience.",
      "For each job, you see which keywords you already have and which ones you're missing — helping you identify the strongest opportunities to apply for, and what to improve in your resume before you submit.",
      "You can filter results by location, employment type, and posting date — then save the jobs that interest you to review and apply to later.",
    ],
  },
  benefits: {
    title: "What will I get?",
    cards: [
      {
        icon: "target",
        title: "Match Score Per Job",
        desc: "A clear percentage showing how well your resume aligns with each specific posting.",
      },
      {
        icon: "brain",
        title: "Matched & Missing Keywords",
        desc: "Which keywords you have and which ones you need to add before applying.",
      },
      {
        icon: "filter",
        title: "Precise Filtering",
        desc: "Filter by location, employment type, and date — reach the right job fast.",
      },
      {
        icon: "bookmark",
        title: "Job Bookmarking",
        desc: "Save important jobs and review them any time — never miss an opportunity.",
      },
      {
        icon: "star",
        title: "AI Insights Per Job",
        desc: "Deep analysis of how well you fit each role across multiple dimensions.",
      },
      {
        icon: "zap",
        title: "Results from Major Platforms",
        desc: "Jobs aggregated from the largest employment platforms globally and regionally.",
      },
    ],
  },
  howItWorks: {
    title: "How does it work?",
    steps: [
      {
        n: "1",
        title: "Upload Your Resume and Search",
        desc: "Enter a job title and location — the system fetches results and scores them against your resume.",
      },
      {
        n: "2",
        title: "Review Match Scores",
        desc: "See each job with its score and a summary of matched and missing keywords.",
      },
      {
        n: "3",
        title: "Apply with Confidence or Improve First",
        desc: "High match score? Apply. Low score? Add the missing keywords to your resume first.",
      },
    ],
  },
  results: {
    title: "What results can you expect?",
    items: [
      "Stop applying to jobs that don't fit you — focus on real opportunities",
      "Know the keywords you're missing before every application",
      "Save time spent searching randomly across dozens of platforms",
      "Increase your chances of passing ATS filters in every application",
      "Make data-driven application decisions — no more guessing",
    ],
  },
  audience: {
    title: "Who is this for?",
    cards: [
      {
        icon: "graduationCap",
        title: "Entry-Level Graduates",
        desc: "Know which jobs match your current qualifications and which need more experience.",
      },
      {
        icon: "briefcase",
        title: "Professionals Ready for a Change",
        desc: "Evaluate your fit with new roles before sending your resume.",
      },
      {
        icon: "users",
        title: "Active Multi-Job Applicants",
        desc: "Organize your search and save top opportunities — stop managing everything manually.",
      },
    ],
  },
  why: {
    title: "Why JobAI24?",
    items: [
      "Match scoring is based on your actual resume — not just your job title",
      "Matched and missing keywords for every posting",
      "Results aggregated from multiple global platforms in one place",
      "Easy saving and organizing of favorite jobs",
      "Direct integration with Resume Enhancement service",
      "Bilingual interface (Arabic & English) — suited for every job seeker in the region",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "Where do the jobs come from?",
        a: "Jobs are aggregated from major global and regional employment platforms.",
      },
      {
        q: "Do I have to upload my resume to use search?",
        a: "No. You can search without a resume, but match scoring and keyword analysis require a linked resume.",
      },
      {
        q: "How is the match score calculated?",
        a: "The system compares your skills, experience, and keywords against the job requirements and calculates a match percentage.",
      },
      {
        q: "Can I link more than one resume?",
        a: "Yes. You can select any resume from your uploaded CVs for match scoring.",
      },
      {
        q: "Do results include Saudi Arabia jobs?",
        a: "Yes. You can filter results by location, including Saudi cities.",
      },
      {
        q: "What are missing keywords?",
        a: "Keywords and skills required in the job that don't currently appear in your resume — adding them improves your match score.",
      },
      {
        q: "Can I apply directly from the platform?",
        a: "You're redirected to the original job listing page on the source platform to complete your application.",
      },
      {
        q: "How is this different from Indeed or LinkedIn?",
        a: "The key difference is personal fit scoring — those platforms show general listings; JobAI24 tells you specifically which ones match you.",
      },
    ],
  },
  finalCta: {
    h2: "Search smart. Apply with confidence.",
    sub: "Upload your resume and start finding jobs that actually fit you.",
    cta: "Start Smart Job Search",
    note: "No credit card required",
  },
};

const BENEFIT_ICONS = {
  target: Target,
  brain: Brain,
  filter: Filter,
  bookmark: Bookmark,
  star: Star,
  zap: Zap,
  barChart: BarChart3,
  trendingUp: TrendingUp,
} as const;

const AUDIENCE_ICONS = {
  graduationCap: GraduationCap,
  briefcase: Briefcase,
  users: Users,
} as const;

export default async function JobSearchPage() {
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
            href="/dashboard/job-search"
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
            href="/dashboard/job-search"
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
