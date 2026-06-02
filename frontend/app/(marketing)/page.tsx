"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Target, Zap,
  BarChart3, Star, MessageSquare,
  Brain, Award, TrendingUp, Upload, Clock,
  Play, Rocket,
} from "lucide-react";

/* ─── types ──────────────────────────────────────────────────────────── */
type Content = {
  nav: { cta: string; login: string };
  hero: {
    badge: string;
    h1: [string, string];
    sub: string;
    cta: string;
    ctaAlt: string;
    trust: [string, string, string];
    rating: string;
    ratingNote: string;
  };
  stats: { num: string; label: string }[];
  demo: {
    label: string;
    headline: string;
    sub: string;
    tabs: { id: string; label: string }[];
    ats: { score: string; label: string; matched: string[]; missing: string[]; tips: string[] };
    rewrite: { before: string; after: string; scoreB: string; scoreA: string };
    interview: { q: string; score: string; tags: string[] };
  };
  benefits: {
    label: string;
    headline: string;
    sub: string;
    items: { icon: string; title: string; stat: string; desc: string }[];
  };
  howItWorks: {
    label: string;
    headline: string;
    steps: { num: string; title: string; desc: string }[];
  };
  features: {
    label: string;
    headline: string;
    sub: string;
    items: { title: string; desc: string; bullets: string[] }[];
  };
  beforeAfter: {
    label: string;
    headline: string;
    sub: string;
    scoreBefore: string;
    scoreAfter: string;
    labelBefore: string;
    labelAfter: string;
    rows: { metric: string; before: string; after: string }[];
  };
  testimonials: {
    label: string;
    headline: string;
    items: { name: string; role: string; city: string; text: string; highlight: string }[];
  };
  finalCta: {
    headline: string;
    sub: string;
    cta: string;
    trust: [string, string, string];
  };
};

/* ─── bilingual content ──────────────────────────────────────────────── */
const AR: Content = {
  nav: { cta: "ابدأ مجاناً", login: "الدخول" },
  hero: {
    badge: "الذكاء الاصطناعي لسوق العمل الخليجي",
    h1: ["احصل على مقابلة.", "ليس على رفض آخر."],
    sub: "JobAI يحلّل سيرتك، يكشف لماذا تُرفض، ويعيد كتابتها لتتجاوز أنظمة ATS وتصل لمكتب المدير مباشرةً.",
    cta: "حلّل سيرتي مجاناً",
    ctaAlt: "شاهد كيف يعمل",
    trust: ["بدون بطاقة ائتمانية", "نتائج في ٣٠ ثانية", "+٥٠٠٠ محترف وثق بنا"],
    rating: "٤.٩/٥",
    ratingNote: "+٥٠٠ تقييم موثّق",
  },
  stats: [
    { num: "+٥٠٠٠", label: "محترف وشركة" },
    { num: "٩٢٪", label: "يصلون للمقابلة" },
    { num: "٣٠ث", label: "وقت التحليل" },
    { num: "+٥٠", label: "معيار ATS" },
  ],
  demo: {
    label: "معاينة المنتج",
    headline: "شاهد JobAI في العمل",
    sub: "تجربة حقيقية داخل المنصة — من رفع السيرة إلى الحصول على المقابلة.",
    tabs: [
      { id: "ats", label: "تحليل ATS" },
      { id: "rewrite", label: "إعادة الكتابة" },
      { id: "interview", label: "تدريب المقابلة" },
    ],
    ats: {
      score: "٨٥",
      label: "درجة التوافق",
      matched: ["إدارة المشاريع", "Python", "العمل الجماعي", "تطوير البرمجيات"],
      missing: ["Agile", "AWS", "REST APIs", "DevOps"],
      tips: ["أضف قسم المهارات التقنية", "اذكر نتائج قابلة للقياس", "أضف Agile و Scrum"],
    },
    rewrite: {
      before: "عملت في مجال تطوير البرمجيات لعدة سنوات وكنت أساعد الفريق في إنجاز المهام.",
      after: "قدت فريق مكوّن من ٥ مطورين لإطلاق منتج SaaS خدم ٥٠٠,٠٠٠ مستخدم، مع تحسين أداء النظام بنسبة ٤٠٪.",
      scoreB: "٣٤",
      scoreA: "٨٩",
    },
    interview: {
      q: "صف تجربتك في قيادة فريق في ظروف ضاغطة.",
      score: "٨٨",
      tags: ["وضوح ممتاز", "ثقة عالية", "أضف أمثلة بأرقام"],
    },
  },
  benefits: {
    label: "لماذا JobAI",
    headline: "نتائج، لا وعود.",
    sub: "كل ميزة مبنية بهدف واحد: المقابلة.",
    items: [
      { icon: "filter", title: "تجاوز أنظمة ATS", stat: "٧٥٪", desc: "من السير تُرفض قبل أن يراها بشر. نحن نضمن أنك لن تكون منهم." },
      { icon: "trending", title: "ضاعف فرصك", stat: "٨٧٪", desc: "من مستخدمينا يصلون لمرحلة المقابلة بعد تحسين سيرتهم." },
      { icon: "clock", title: "وفّر وقتك", stat: "٣٥د", desc: "متوسط الوقت لإعداد سيرة ذاتية احترافية ومحسّنة بالكامل." },
      { icon: "rocket", title: "قدّم بذكاء", stat: "٣×", desc: "أسرع في الحصول على عروض العمل مقارنة بالتقديم التقليدي." },
    ],
  },
  howItWorks: {
    label: "كيف يعمل",
    headline: "ثلاث خطوات. نتائج تراها.",
    steps: [
      { num: "١", title: "ارفع سيرتك الذاتية", desc: "PDF أو Word — يستخرج JobAI بياناتك ومؤهلاتك في ثوانٍ." },
      { num: "٢", title: "احصل على توصيات AI", desc: "تقرير شامل بـ +٥٠ معيار، كلمات مفتاحية ناقصة، وخطة تحسين واضحة." },
      { num: "٣", title: "قدّم بثقة", desc: "سيرة محسّنة + Cover Letter مخصصة + تدريب على المقابلة." },
    ],
  },
  features: {
    label: "أبرز المميزات",
    headline: "كل ما تحتاجه للحصول على الوظيفة.",
    sub: "أدوات ذكاء اصطناعي متكاملة لكل مرحلة من مراحل بحثك.",
    items: [
      {
        title: "تحليل ATS بـ +٥٠ معياراً",
        desc: "اعرف بالضبط لماذا تُرفض سيرتك — وكيف تُصلحها.",
        bullets: ["تقرير نقاط مفصّل", "مقارنة بالوظيفة المستهدفة", "أولويات التحسين واضحة"],
      },
      {
        title: "إعادة كتابة بالذكاء الاصطناعي",
        desc: "سيرتك تتحول في ثوانٍ لتنافس كبار المتقدمين.",
        bullets: ["اقتراحات جاهزة بنقرة واحدة", "يحافظ على أسلوبك", "يُضخّ الكلمات المفتاحية"],
      },
      {
        title: "Cover Letter مخصصة لكل وظيفة",
        desc: "ثلاثة أساليب: رسمي، إبداعي، مختصر — في ٣٠ ثانية.",
        bullets: ["مخصصة لكل جهة عمل", "عربي وإنجليزي", "إرسال مباشر عبر Gmail"],
      },
      {
        title: "تدريب تفاعلي على المقابلة",
        desc: "تدرّب على أسئلة مخصصة لوظيفتك قبل المقابلة.",
        bullets: ["أسئلة من CV والوظيفة", "تقييم فوري مع ملاحظات", "دعم عربي وإنجليزي"],
      },
    ],
  },
  beforeAfter: {
    label: "التحول الحقيقي",
    headline: "من رفض متكرر إلى ٣ عروض في ٣ أسابيع.",
    sub: "أحمد، مهندس برمجيات بخبرة ٥ سنوات، كان يتقدم لشهور دون ردود.",
    scoreBefore: "٣٤",
    scoreAfter: "٨٩",
    labelBefore: "قبل JobAI",
    labelAfter: "بعد JobAI",
    rows: [
      { metric: "معدل فتح الطلب", before: "٨٪", after: "٦٧٪" },
      { metric: "ردود خلال ٧ أيام", before: "٠", after: "٤ ردود" },
      { metric: "وقت إعداد CV", before: "٣ أيام", after: "٣٥ دقيقة" },
    ],
  },
  testimonials: {
    label: "يقولون عنا",
    headline: "مستخدمونا يتحدثون عن النتائج.",
    items: [
      {
        name: "سارة الأحمد",
        role: "أخصائية تسويق رقمي",
        city: "الرياض",
        highlight: "٣ مقابلات في ٣ أسابيع",
        text: "بعد ٦ أشهر من رفض ATS المتكرر، وصلت لمرحلة المقابلة في ٣ شركات كبرى خلال ٣ أسابيع. الفرق لا يُصدَّق.",
      },
      {
        name: "محمد القحطاني",
        role: "مدير مشاريع تقني",
        city: "جدة",
        highlight: "درجة ATS: من ٣٤ لـ ٨٩",
        text: "التحليل كشف مشاكل لم أتوقعها. الأفضل أن التقرير يشرح بالضبط كيف تحل كل مشكلة — ليس مجرد انتقادات.",
      },
      {
        name: "نورة الزهراني",
        role: "محاسبة قانونية معتمدة",
        city: "الدمام",
        highlight: "قُبلت في أرامكو",
        text: "ميزة المقابلة التدريبية غيّرت حياتي. كنت أخاف من المقابلات — الآن أدخلها بثقة كاملة.",
      },
    ],
  },
  finalCta: {
    headline: "وظيفة أحلامك ليست حظاً.",
    sub: "أكثر من ٥٠٠٠ محترف سعودي وخليجي حوّلوا مسيرتهم مع JobAI. أنت التالي.",
    cta: "حلّل سيرتي مجاناً الآن",
    trust: ["بدون بطاقة ائتمانية", "إلغاء في أي وقت", "نتائج في ٣٠ ثانية"],
  },
};

const EN: Content = {
  nav: { cta: "Start Free", login: "Sign In" },
  hero: {
    badge: "AI-Powered Career Platform for Saudi Arabia & GCC",
    h1: ["Get More Interviews.", "Not More Rejections."],
    sub: "JobAI analyzes your resume in 30 seconds, reveals why it's being rejected, and rewrites it to pass every ATS filter — landing it on the hiring manager's desk.",
    cta: "Analyze My Resume — Free",
    ctaAlt: "Watch Demo",
    trust: ["No credit card required", "Results in 30 seconds", "5,000+ professionals trust us"],
    rating: "4.9/5",
    ratingNote: "500+ verified reviews",
  },
  stats: [
    { num: "5,000+", label: "Professionals & companies" },
    { num: "92%", label: "Reach interview stage" },
    { num: "30s", label: "Analysis time" },
    { num: "50+", label: "ATS criteria" },
  ],
  demo: {
    label: "Product Preview",
    headline: "See JobAI in Action",
    sub: "A real look at the platform — from uploading your resume to landing the interview.",
    tabs: [
      { id: "ats", label: "ATS Analysis" },
      { id: "rewrite", label: "AI Rewrite" },
      { id: "interview", label: "Interview Training" },
    ],
    ats: {
      score: "85",
      label: "Match Score",
      matched: ["Project Management", "Python", "Team Leadership", "Software Development"],
      missing: ["Agile", "AWS", "REST APIs", "DevOps"],
      tips: ["Add a technical skills section", "Add measurable results with numbers", "Include Agile / Scrum experience"],
    },
    rewrite: {
      before: "Worked in software development for several years and helped the team complete tasks.",
      after: "Led a 5-person engineering team to ship a SaaS product serving 500,000 users, improving system performance by 40%.",
      scoreB: "34",
      scoreA: "89",
    },
    interview: {
      q: "Describe your experience leading a team under high-pressure conditions.",
      score: "88",
      tags: ["Excellent clarity", "High confidence", "Tip: add quantified examples"],
    },
  },
  benefits: {
    label: "Why JobAI",
    headline: "Outcomes, not promises.",
    sub: "Every feature is built for one purpose: getting you the interview.",
    items: [
      { icon: "filter", title: "Pass ATS Filters", stat: "75%", desc: "of resumes are rejected before a human sees them. We make sure you're not one of them." },
      { icon: "trending", title: "Double Your Chances", stat: "87%", desc: "of our users reach the interview stage after improving their resume with JobAI." },
      { icon: "clock", title: "Save Hours", stat: "35m", desc: "Average time to prepare a fully optimized, professional resume with JobAI." },
      { icon: "rocket", title: "Apply Smarter", stat: "3×", desc: "faster at landing job offers compared to the traditional application process." },
    ],
  },
  howItWorks: {
    label: "How It Works",
    headline: "Three steps. Real results.",
    steps: [
      { num: "1", title: "Upload Your Resume", desc: "PDF or Word — JobAI instantly extracts your data, qualifications, and experience in seconds." },
      { num: "2", title: "Get AI Recommendations", desc: "A comprehensive 50+ criteria report, missing keyword identification, and a clear improvement plan." },
      { num: "3", title: "Apply With Confidence", desc: "Optimized resume + custom cover letter + interview practice all ready to go." },
    ],
  },
  features: {
    label: "Top Features",
    headline: "Everything you need to land the job.",
    sub: "Integrated AI tools for every stage of your job search journey.",
    items: [
      {
        title: "ATS Analysis: 50+ Criteria",
        desc: "Know exactly why your resume is rejected — and exactly how to fix it.",
        bullets: ["Comprehensive scoring breakdown", "Target job comparison", "Prioritized action items"],
      },
      {
        title: "AI-Powered Rewrite",
        desc: "Your resume transforms in seconds to compete with top candidates.",
        bullets: ["One-click suggestion acceptance", "Preserves your personal voice", "Injects the right keywords"],
      },
      {
        title: "Custom Cover Letters",
        desc: "Three tailored styles per job in under 30 seconds.",
        bullets: ["Customized per employer", "Arabic & English support", "Direct Gmail sending"],
      },
      {
        title: "AI Interview Training",
        desc: "Practice with questions tailored to your exact role before the real interview.",
        bullets: ["Questions from your CV + job", "Real-time answer evaluation", "Arabic & English support"],
      },
    ],
  },
  beforeAfter: {
    label: "Real Transformation",
    headline: "From 6 months of silence to 3 job offers in 3 weeks.",
    sub: "Ahmed, a software engineer with 5 years of experience, applied for months with zero responses.",
    scoreBefore: "34",
    scoreAfter: "89",
    labelBefore: "Before JobAI",
    labelAfter: "After JobAI",
    rows: [
      { metric: "Application open rate", before: "8%", after: "67%" },
      { metric: "Responses within 7 days", before: "0", after: "4 responses" },
      { metric: "CV preparation time", before: "3 days", after: "35 minutes" },
    ],
  },
  testimonials: {
    label: "What They Say",
    headline: "Our users speak for themselves.",
    items: [
      {
        name: "Sara Al-Ahmad",
        role: "Digital Marketing Specialist",
        city: "Riyadh",
        highlight: "3 interviews in 3 weeks",
        text: "After 6 months of ATS rejections, I reached the interview stage at 3 major companies in 3 weeks. The difference is unbelievable.",
      },
      {
        name: "Mohammed Al-Qahtani",
        role: "Technical Project Manager",
        city: "Jeddah",
        highlight: "ATS score: 34 → 89",
        text: "The analysis revealed issues I never expected. Best part: the report explains exactly how to fix each one — not just a list of criticisms.",
      },
      {
        name: "Nora Al-Zahrani",
        role: "Certified Public Accountant",
        city: "Dammam",
        highlight: "Landed at Aramco",
        text: "The AI interview training changed everything. I used to dread interviews — now I walk in with complete confidence.",
      },
    ],
  },
  finalCta: {
    headline: "Your dream job isn't luck.",
    sub: "Over 5,000 Saudi and Gulf professionals have transformed their careers with JobAI. You're next.",
    cta: "Analyze My Resume — Free",
    trust: ["No credit card required", "Cancel anytime", "Results in 30 seconds"],
  },
};

/* ─── animated counter ───────────────────────────────────────────────── */
function useCountUp(target: string, duration = 1500) {
  const [display, setDisplay] = useState("0");
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const raw = target.replace(/[^\d.]/g, "");
    const num = parseFloat(raw);
    if (isNaN(num)) { setDisplay(target); return; }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * num);
            setDisplay(target.replace(raw, current.toString()));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { display, ref };
}

/* ─── score ring ─────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 120, color = "#1A468C", label }: { score: number; size?: number; color?: string; label?: string }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
      </svg>
      {label && <span className="text-xs font-semibold text-slate-500">{label}</span>}
    </div>
  );
}

/* ─── main ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const locale = useLocale();
  const t = locale === "ar" ? AR : EN;
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="overflow-x-hidden bg-white">
      <HeroSection t={t} Arrow={Arrow} />
      <StatsSection t={t} />
      <DemoSection t={t} />
      <BenefitsSection t={t} />
      <HowItWorksSection t={t} Arrow={Arrow} />
      <FeaturesSection t={t} />
      <BeforeAfterSection t={t} />
      <TestimonialsSection t={t} />
      <FinalCtaSection t={t} Arrow={Arrow} />
    </div>
  );
}

/* ─── 1. hero ────────────────────────────────────────────────────────── */
function HeroSection({ t, Arrow }: { t: Content; Arrow: React.ElementType }) {
  const h = t.hero;
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 pb-28 pt-16 md:pt-24 md:pb-40">
      {/* Background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute top-1/2 right-0 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-teal/10 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-brand-800/30 blur-[80px]" />
        {/* Grid pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <div className="mb-8 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-brand-400" />
            {h.badge}
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-[2.8rem] font-black leading-[1.05] tracking-tight text-white md:text-[5.5rem] lg:text-[6.5rem]">
          <span className="block">{h.h1[0]}</span>
          <span className="block bg-gradient-to-r from-brand-300 via-teal to-brand-400 bg-clip-text text-transparent">
            {h.h1[1]}
          </span>
        </h1>

        {/* Sub */}
        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
          {h.sub}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/register"
            className="group inline-flex h-14 items-center gap-2.5 rounded-xl bg-brand-500 px-8 text-base font-bold text-white shadow-[0_0_40px_rgba(26,70,140,0.4)] transition-all hover:bg-brand-400 hover:shadow-[0_0_60px_rgba(26,70,140,0.5)] hover:-translate-y-0.5"
          >
            {h.cta}
            <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button className="inline-flex h-14 items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/20">
            <Play className="h-4 w-4 text-teal" />
            {h.ctaAlt}
          </button>
        </div>

        {/* Trust row */}
        <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-slate-500">
          {h.trust.map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal" />
              {item}
            </span>
          ))}
        </div>

        {/* Avatar + rating */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <div className="flex -space-x-2.5 rtl:space-x-reverse">
            {["م", "س", "أ", "ف", "ر"].map((l, i) => (
              <div
                key={i}
                className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-900 text-xs font-black text-white shadow-md"
                style={{ background: `hsl(${210 + i * 15}, 60%, 45%)` }}
              >
                {l}
              </div>
            ))}
          </div>
          <div className="text-start">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-bold text-slate-300">{h.rating}</span> — {h.ratingNote}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div aria-hidden className="pointer-events-none absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

/* ─── 2. stats ───────────────────────────────────────────────────────── */
function StatItem({ num, label }: { num: string; label: string }) {
  const { display, ref } = useCountUp(num);
  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-black tabular-nums text-brand-600 md:text-5xl">{display}</div>
      <div className="mt-1.5 text-sm text-slate-500 leading-snug">{label}</div>
    </div>
  );
}

function StatsSection({ t }: { t: Content }) {
  return (
    <div className="border-b border-slate-100 py-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {t.stats.map((s) => <StatItem key={s.label} {...s} />)}
        </div>
      </div>
    </div>
  );
}

/* ─── 3. product demo ────────────────────────────────────────────────── */
function DemoSection({ t }: { t: Content }) {
  const [active, setActive] = useState(t.demo.tabs[0].id);
  const d = t.demo;

  return (
    <section className="py-24 bg-white" id="demo">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">{d.label}</p>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl">{d.headline}</h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">{d.sub}</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {d.tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                active === tab.id
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-200/50"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.12)]">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-5 py-3.5">
            <div className="flex gap-1.5">
              {["bg-red-400", "bg-amber-400", "bg-green-400"].map((c, i) => (
                <div key={i} className={`h-2.5 w-2.5 rounded-full ${c}`} />
              ))}
            </div>
            <div className="flex-1 rounded-lg bg-slate-100 px-4 py-1 text-center text-xs text-slate-400 max-w-[300px] mx-auto">
              app.jobai.sa
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-10">
            {active === "ats" && <AtsPanel d={d} />}
            {active === "rewrite" && <RewritePanel d={d} />}
            {active === "interview" && <InterviewPanel d={d} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function AtsPanel({ d }: { d: Content["demo"] }) {
  const a = d.ats;
  const score = parseInt(a.score.replace(/[^\d]/g, ""), 10) || 85;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Score */}
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-6 border border-slate-100 shadow-sm">
        <div className="relative flex items-center justify-center">
          <ScoreRing score={score} size={130} color="#1A468C" />
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-black text-brand-600">{a.score}</span>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">{a.label}</span>
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-teal mb-3">✓ Matched</p>
          <div className="flex flex-wrap gap-1.5">
            {a.matched.map((kw) => (
              <span key={kw} className="rounded-full bg-teal-light/60 px-2.5 py-1 text-xs font-semibold text-teal">{kw}</span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-red-500 mb-3">✗ Missing</p>
          <div className="flex flex-wrap gap-1.5">
            {a.missing.map((kw) => (
              <span key={kw} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-500">{kw}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-brand-600 mb-3">Top Fixes</p>
        <ul className="space-y-3">
          {a.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-black text-white">{i + 1}</span>
              <span className="text-sm text-slate-600 leading-snug">{tip}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RewritePanel({ d }: { d: Content["demo"] }) {
  const r = d.rewrite;
  const scoreB = parseInt(r.scoreB.replace(/[^\d]/g, ""), 10) || 34;
  const scoreA = parseInt(r.scoreA.replace(/[^\d]/g, ""), 10) || 89;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-red-500">Before</p>
          <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-500">{r.scoreB}</span>
        </div>
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
          <p className="text-sm text-slate-500 leading-relaxed italic">{'"'}{r.before}{'"'}</p>
        </div>
        <div className="flex justify-center">
          <ScoreRing score={scoreB} size={80} color="#ef4444" label={r.scoreB} />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-teal">After AI Rewrite</p>
          <span className="rounded-full bg-teal-light/60 px-3 py-1 text-sm font-black text-teal">{r.scoreA}</span>
        </div>
        <div className="rounded-2xl border border-teal-light bg-teal-light/30 p-5">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{'"'}{r.after}{'"'}</p>
        </div>
        <div className="flex justify-center">
          <ScoreRing score={scoreA} size={80} color="#00A878" label={r.scoreA} />
        </div>
      </div>
    </div>
  );
}

function InterviewPanel({ d }: { d: Content["demo"] }) {
  const iv = d.interview;
  const score = parseInt(iv.score.replace(/[^\d]/g, ""), 10) || 88;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Question</p>
          <p className="text-base font-semibold text-slate-800 leading-relaxed">{'"'}{iv.q}{'"'}</p>
        </div>
        <div className="rounded-2xl bg-brand-600 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-200 mb-2">Your Answer (recorded)</p>
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-brand-500">
              <div className="h-2 w-[72%] rounded-full bg-white/70" />
            </div>
            <span className="text-xs text-brand-200">0:42</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-sm p-6 gap-4">
        <p className="text-xs font-black uppercase tracking-wider text-slate-400">AI Evaluation</p>
        <div className="relative flex items-center justify-center">
          <ScoreRing score={score} size={110} color="#00A878" />
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-black text-teal">{iv.score}</span>
            <span className="text-[10px] text-slate-400">Score</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {iv.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 4. benefits ────────────────────────────────────────────────────── */
const BENEFIT_ICONS: Record<string, React.ElementType> = {
  filter: Target,
  trending: TrendingUp,
  clock: Clock,
  rocket: Rocket,
};

const BENEFIT_COLORS = [
  { bg: "bg-brand-50", text: "text-brand-600", stat: "text-brand-600", border: "border-brand-100" },
  { bg: "bg-teal-light/50", text: "text-teal", stat: "text-teal", border: "border-teal-light" },
  { bg: "bg-amber-50", text: "text-amber-600", stat: "text-amber-600", border: "border-amber-100" },
  { bg: "bg-purple-50", text: "text-purple-600", stat: "text-purple-600", border: "border-purple-100" },
];

function BenefitsSection({ t }: { t: Content }) {
  const b = t.benefits;
  return (
    <section className="py-24 bg-slate-950" id="benefits">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-400">{b.label}</p>
          <h2 className="text-3xl font-black text-white md:text-5xl">{b.headline}</h2>
          <p className="mt-4 text-lg text-slate-400 max-w-md mx-auto">{b.sub}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {b.items.map((item, i) => {
            const Icon = BENEFIT_ICONS[item.icon] ?? Zap;
            const c = BENEFIT_COLORS[i];
            return (
              <div
                key={item.title}
                className="group rounded-3xl border border-white/5 bg-white/5 p-7 backdrop-blur-sm transition-all hover:bg-white/8 hover:-translate-y-1 hover:border-white/10"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${c.bg}`}>
                  <Icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <div className={`text-4xl font-black ${c.stat} mb-2`}>{item.stat}</div>
                <h3 className="font-black text-white text-lg mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 5. how it works ────────────────────────────────────────────────── */
const HOW_ICONS = [Upload, BarChart3, Award];

function HowItWorksSection({ t, Arrow }: { t: Content; Arrow: React.ElementType }) {
  const h = t.howItWorks;
  return (
    <section className="py-24 bg-white" id="how-it-works">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">{h.label}</p>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl">{h.headline}</h2>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div
            aria-hidden
            className="absolute top-10 left-10 right-10 h-0.5 bg-gradient-to-r from-brand-200 via-teal-light to-brand-200 hidden md:block"
          />

          <div className="grid gap-6 md:grid-cols-3 relative z-10">
            {h.steps.map((step, i) => {
              const Icon = HOW_ICONS[i] ?? Zap;
              return (
                <div key={step.num} className="group text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 shadow-[0_8px_30px_rgba(26,70,140,0.3)] transition-all group-hover:scale-105 group-hover:shadow-[0_12px_40px_rgba(26,70,140,0.4)]">
                      <Icon className="h-8 w-8 text-white" />
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-teal text-[11px] font-black text-white">
                        {step.num}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm max-w-xs mx-auto">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/register"
            className="group inline-flex h-14 items-center gap-2.5 rounded-xl bg-brand-600 px-10 text-base font-bold text-white shadow-xl shadow-brand-200/50 transition-all hover:bg-brand-700 hover:-translate-y-0.5"
          >
            {t.finalCta.cta}
            <Arrow className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── 6. features ────────────────────────────────────────────────────── */
const FEAT_ICONS = [BarChart3, Zap, MessageSquare, Brain];
const FEAT_COLORS = [
  { icon: "bg-brand-50 text-brand-600", border: "hover:border-brand-200 hover:shadow-brand-50" },
  { icon: "bg-amber-50 text-amber-600", border: "hover:border-amber-200 hover:shadow-amber-50" },
  { icon: "bg-teal-light/50 text-teal", border: "hover:border-teal-light hover:shadow-teal-light/30" },
  { icon: "bg-purple-50 text-purple-600", border: "hover:border-purple-200 hover:shadow-purple-50" },
];

function FeaturesSection({ t }: { t: Content }) {
  const f = t.features;
  return (
    <section className="py-24 bg-slate-50" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">{f.label}</p>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl">{f.headline}</h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">{f.sub}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {f.items.map((item, i) => {
            const Icon = FEAT_ICONS[i] ?? Zap;
            const c = FEAT_COLORS[i];
            return (
              <div
                key={item.title}
                className={`group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${c.border}`}
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${c.icon}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm mb-5 leading-relaxed">{item.desc}</p>
                <ul className="space-y-2">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 7. before / after ──────────────────────────────────────────────── */
function BeforeAfterSection({ t }: { t: Content }) {
  const ba = t.beforeAfter;
  const scoreB = parseInt(ba.scoreBefore.replace(/[^\d]/g, ""), 10) || 34;
  const scoreA = parseInt(ba.scoreAfter.replace(/[^\d]/g, ""), 10) || 89;

  return (
    <section className="py-24 bg-white" id="results">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-12">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">{ba.label}</p>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl max-w-2xl mx-auto leading-tight">
            {ba.headline}
          </h2>
          <p className="mt-4 text-slate-500 max-w-lg mx-auto">{ba.sub}</p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-slate-50 overflow-hidden shadow-[0_20px_60px_-15px_rgba(15,23,42,0.1)]">
          {/* Score comparison */}
          <div className="grid md:grid-cols-2">
            {/* Before */}
            <div className="flex flex-col items-center gap-5 p-10 border-b md:border-b-0 md:border-r border-slate-200">
              <span className="rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-black text-red-500 uppercase tracking-wider">
                {ba.labelBefore}
              </span>
              <div className="relative flex items-center justify-center">
                <ScoreRing score={scoreB} size={150} color="#ef4444" />
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-red-500">{ba.scoreBefore}</span>
                  <span className="text-xs text-slate-400 font-medium">ATS Score</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400">Rejected by 92% of ATS systems</p>
              </div>
            </div>

            {/* After */}
            <div className="flex flex-col items-center gap-5 p-10 bg-gradient-to-br from-white to-teal-light/10">
              <span className="rounded-full bg-teal-light/60 border border-teal-light px-3 py-1 text-xs font-black text-teal uppercase tracking-wider">
                {ba.labelAfter}
              </span>
              <div className="relative flex items-center justify-center">
                <ScoreRing score={scoreA} size={150} color="#00A878" />
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-teal">{ba.scoreAfter}</span>
                  <span className="text-xs text-slate-400 font-medium">ATS Score</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-teal font-semibold">Passes 95% of ATS systems ✓</p>
              </div>
            </div>
          </div>

          {/* Metrics table */}
          <div className="border-t border-slate-200">
            {ba.rows.map((row, i) => (
              <div
                key={row.metric}
                className={`grid grid-cols-3 items-center px-8 py-4 text-sm ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
              >
                <span className="font-semibold text-slate-600">{row.metric}</span>
                <span className="text-center font-bold text-red-400">{row.before}</span>
                <span className="text-center font-black text-teal">{row.after}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 8. testimonials ────────────────────────────────────────────────── */
function TestimonialsSection({ t }: { t: Content }) {
  const te = t.testimonials;
  const initials = ["س", "م", "ن"];
  const colors = ["from-brand-400 to-brand-600", "from-teal to-teal-light", "from-purple-400 to-purple-600"];

  return (
    <section className="py-24 bg-slate-950" id="testimonials">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-400">{te.label}</p>
          <h2 className="text-3xl font-black text-white md:text-5xl">{te.headline}</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {te.items.map((item, i) => (
            <div
              key={item.name}
              className="group rounded-3xl border border-white/5 bg-white/5 p-7 backdrop-blur-sm transition-all hover:bg-white/8 hover:-translate-y-1 hover:border-white/10"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Highlight badge */}
              <span className="mb-4 inline-block rounded-full bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
                {item.highlight}
              </span>

              {/* Quote */}
              <p className="text-slate-300 leading-relaxed text-sm mb-6">{'"'}{item.text}{'"'}</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${colors[i]} text-sm font-black text-white`}>
                  {initials[i]}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{item.name}</p>
                  <p className="text-xs text-slate-400">{item.role} · {item.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── faq (mini) ─────────────────────────────────────────────────────── */

/* ─── 9. final cta ───────────────────────────────────────────────────── */
function FinalCtaSection({ t, Arrow }: { t: Content; Arrow: React.ElementType }) {
  const c = t.finalCta;
  return (
    <section className="py-16 px-6 pb-24 bg-white">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-brand-900 to-brand-700 px-8 py-20 text-center text-white shadow-2xl">
          {/* Glows */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2.5rem]">
            <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-teal/15 blur-3xl" />
            <div className="absolute -bottom-10 left-0 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl" />
            <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid2)" />
            </svg>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl font-black md:text-6xl leading-tight mb-5">
              {c.headline}
              <br />
              <span className="bg-gradient-to-r from-teal to-brand-300 bg-clip-text text-transparent">
                {t.finalCta.sub.split(".")[0]}.
              </span>
            </h2>
            <p className="mx-auto max-w-xl text-slate-300 text-lg mb-10 leading-relaxed">
              {c.sub}
            </p>

            <Link
              href="/register"
              className="group inline-flex h-16 items-center gap-3 rounded-2xl bg-white px-14 text-lg font-black text-brand-700 shadow-2xl transition-all hover:scale-[1.03] hover:bg-brand-50 active:scale-[0.98]"
            >
              {c.cta}
              <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
              {c.trust.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
