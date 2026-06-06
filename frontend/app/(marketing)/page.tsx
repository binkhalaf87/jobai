"use client";

import { useLocale } from "next-intl";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { SmartMarketingSection } from "@/components/marketing/smart-marketing-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { FinalCTASection } from "@/components/marketing/final-cta-section";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Arabic content                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

const AR = {
  hero: {
    badge: "منصة مهنية بالذكاء الاصطناعي · أدواتك نحو فرصتك",
    sub: "ارفع سيرتك الذاتية وخلال ثوانٍ يكشف لك JobAI24 سبب رفضها — ويعيد كتابتها لتحصل على مقابلات أكثر.",
    cta1: "ارفع سيرتك مجاناً",
    cta2: "كيف يعمل؟",
    trust: ["بدون بطاقة ائتمانية", "نتائج خلال ٣٠ ثانية", "بدون تثبيت برامج"],
  },

  problem: {
    badge: "المشكلة الحقيقية",
    h2: "هل هذا مألوف لك؟",
    sub: "يمرّ بها آلاف الباحثين عن عمل كل يوم",
    items: [
      {
        icon: "x",
        title: "سيرتك تُرفض آلياً قبل أن يراها أحد",
        desc: "أكثر من ٧٥٪ من السير الذاتية تُصفّى بواسطة أنظمة ATS قبل أن تصل لأي مسؤول توظيف.",
      },
      {
        icon: "x",
        title: "لا تعرف ما يبحث عنه صاحب العمل",
        desc: "كل إعلان وظيفة يتضمن كلمات مفتاحية محددة — إذا غابت عن سيرتك، غابت فرصتك معها.",
      },
      {
        icon: "x",
        title: "تتقدم كثيراً ولا ترى رداً",
        desc: "ساعات تذهب في إرسال طلبات لا يعود منها إلا الصمت — بلا تغذية راجعة ولا توجيه.",
      },
      {
        icon: "x",
        title: "خطابات التقديم تستنزف وقتك",
        desc: "كتابة خطاب احترافي مخصص لكل وظيفة مهمة مرهقة وتستغرق وقتاً لا يتناسب مع حجم الفرصة.",
      },
    ],
    bridge: "حتى جاء JobAI24",
    bridgeSub: "الأداة التي تحل كل هذه المشاكل في خطوة واحدة",
  },

  how: {
    badge: "بسيط وسريع",
    h2: "ثلاث خطوات إلى مقابلتك",
    sub: "من رفع السيرة إلى التقديم بثقة — في أقل من خمس دقائق",
    steps: [
      {
        num: "١",
        title: "ارفع سيرتك الذاتية",
        desc: "ارفع ملف PDF أو Word. لا يلزم إنشاء حساب للبدء وستحصل على نتائجك فوراً.",
      },
      {
        num: "٢",
        title: "احصل على تحليل فوري بالذكاء الاصطناعي",
        desc: "يحلّل JobAI24 سيرتك ويكشف نقاط الضعف والكلمات المفتاحية المفقودة في ثوانٍ معدودة.",
      },
      {
        num: "٣",
        title: "قدّم بثقة وانتظر المقابلة",
        desc: "احصل على سيرة محسّنة وخطاب تقديم مخصص وابدأ تلقّي دعوات المقابلة.",
      },
    ],
  },

  features: {
    badge: "ما تحصل عليه",
    h2: "كل ما تحتاجه في مكان واحد",
    sub: "أدوات متكاملة صُممت خصيصاً لسوق العمل في الخليج",
    items: [
      {
        icon: "target",
        title: "تحليل ATS الذكي",
        sub: "اعرف بالضبط لماذا تُرفض سيرتك",
        desc: "تحليل شامل وفق أكثر من ٥٠ معياراً لأنظمة تتبع المتقدمين مع درجة توافق دقيقة وتوصيات قابلة للتنفيذ.",
        bullets: ["درجة توافق دقيقة", "كشف الكلمات المفتاحية المفقودة", "توصيات فورية"],
      },
      {
        icon: "sparkles",
        title: "تحسين السيرة بالذكاء الاصطناعي",
        sub: "سيرة تستحق أن تُقرأ",
        desc: "إعادة كتابة احترافية تبرز مهاراتك وإنجازاتك بلغة تجذب أصحاب العمل وتتجاوز المنافسة.",
        bullets: ["صياغة احترافية ومقنعة", "تنسيق متوافق مع ATS", "قابل للتحميل والاستخدام"],
      },
      {
        icon: "mail",
        title: "مولّد خطاب التقديم",
        sub: "خطاب مخصص لكل وظيفة في ثوانٍ",
        desc: "خطابات تقديم مكتوبة بذكاء ومصممة بحسب كل وظيفة وشركة مستهدفة.",
        bullets: ["مخصص لكل طلب وظيفي", "دعم ثنائي اللغة", "احترافي ومقنع"],
      },
      {
        icon: "brain",
        title: "التحضير للمقابلة",
        sub: "اجتاز المقابلة بثقة حقيقية",
        desc: "أسئلة مقابلة مُولَّدة من سيرتك والوظيفة المستهدفة، مع تقييم إجاباتك وتوصيات للتحسين.",
        bullets: ["أسئلة مخصصة حسب الوظيفة", "تقييم الإجابات بالذكاء الاصطناعي", "تدريب متكرر وقابل للتطوير"],
      },
      {
        icon: "trending",
        title: "رؤى مهنية",
        sub: "افهم ما يطلبه سوق العمل منك",
        desc: "قارن مهاراتك بمتطلبات السوق الفعلية واحصل على خارطة طريق واضحة لسد الفجوات.",
        bullets: ["تحليل فجوات المهارات", "اتجاهات سوق العمل", "خطة تطوير مهني واضحة"],
      },
    ],
  },

  smart: {
    badge: "ميزة حصرية",
    h2: "التسويق الذكي للسيرة الذاتية",
    sub: "لا تنتظر إعلان الوظيفة — وصل لأصحاب العمل مباشرة",
    desc: "بدلاً من انتظار الإعلانات، يطلق JobAI24 حملة تواصل ذكية توصّل سيرتك إلى أصحاب العمل المناسبين تلقائياً.",
    steps: [
      { num: "١", title: "ارفع سيرتك وحدد الوظيفة المستهدفة" },
      { num: "٢", title: "يحدّد JobAI24 أصحاب العمل الأنسب لملفك" },
      { num: "٣", title: "تُطلَق حملة تواصل احترافية ومخصصة باسمك" },
    ],
    benefits: [
      "وصول لمئات أصحاب العمل المناسبين",
      "توفير ساعات من التقديم اليدوي المرهق",
      "رسائل تواصل شخصية واحترافية",
      "متابعة نتائج حملتك بشكل مستمر",
      "زيادة حقيقية في فرص الحصول على مقابلات",
    ],
    cta: "ابدأ حملتك المجانية",
    ctaNote: "متاح مع الحساب المجاني — بدون بطاقة ائتمانية",
  },

  benefits: {
    badge: "لماذا JobAI24",
    h2: "ما الذي ستكسبه فعلاً",
    sub: "نتائج ملموسة لمن يريد أن يتقدم بذكاء",
    items: [
      {
        icon: "clock",
        title: "وفّر وقتك",
        desc: "ما كان يأخذ ساعات أصبح يأخذ دقائق. ركّز وقتك على الفرص التي تستحق.",
      },
      {
        icon: "trending",
        title: "قدّم بذكاء",
        desc: "استهدف الوظائف المناسبة بسيرة وخطاب تقديم مُحسَّنَين لكل فرصة على حدة.",
      },
      {
        icon: "shield",
        title: "ابنِ ثقتك",
        desc: "اعرف نقاط قوتك وكيفية إبرازها — وادخل المقابلة بثقة مبنية على أساس حقيقي.",
      },
      {
        icon: "star",
        title: "سيرة تتميز",
        desc: "تصميم وصياغة احترافية تضعك في مقدمة المتقدمين وتجذب انتباه أصحاب العمل.",
      },
      {
        icon: "users",
        title: "شبكة اتصالات أوسع",
        desc: "التسويق الذكي يُوصلك لأصحاب عمل لن تجدهم في إعلانات الوظائف التقليدية.",
      },
      {
        icon: "rocket",
        title: "تطور مهني مستمر",
        desc: "رؤى دورية عن متطلبات السوق تساعدك على البقاء في المقدمة وتطوير مهاراتك.",
      },
    ],
  },

  testimonials: {
    badge: "قالوا عنا",
    h2: "تجارب حقيقية من مستخدمي JobAI24",
    sub: "ما يقوله باحثو العمل الذين جربوا JobAI24",
    items: [
      {
        initials: "ف.ع",
        name: "فاطمة العمري",
        role: "تسويق رقمي",
        text: "كنت أتقدم لوظائف لأشهر دون أي رد. بعد JobAI24 اكتشفت أن سيرتي كانت تُرفض آلياً من البداية. بعد التحسين حصلت على مقابلتين خلال أسبوع واحد.",
      },
      {
        initials: "أ.خ",
        name: "أحمد الخالدي",
        role: "هندسة برمجيات",
        text: "التحليل كشف لي مهارات أساسية كانت غائبة عن سيرتي تماماً. التوصيات كانت دقيقة ومنطقية، وليست إضافات عشوائية. الفرق واضح في الردود التي أتلقاها الآن.",
      },
      {
        initials: "س.ر",
        name: "سارة الراشد",
        role: "محاسبة ومالية",
        text: "كتابة خطاب تقديم احترافي لكل وظيفة كانت تأخذ مني ساعة كاملة. الآن خلال خمس دقائق أمتلك خطاباً مخصصاً واحترافياً. الوقت الذي وفّرته لا يُصدَّق.",
      },
    ],
  },

  cta: {
    badge: "ابدأ مجاناً الآن",
    h2: "لا تدع سيرتك الذاتية تضيع بين مئات المتقدمين",
    sub: "ارفع سيرتك في ثوانٍ وابدأ رحلتك نحو وظيفتك القادمة.",
    cta1: "ارفع سيرتي الآن",
    cta2: "إنشاء حساب مجاني",
    trust: ["بدون بطاقة ائتمانية", "نتائج فورية", "آمن ومشفّر"],
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  English content                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const EN = {
  hero: {
    badge: "AI Career Platform · Built for Ambitious Job Seekers",
    sub: "Upload your resume and within seconds JobAI24 shows you exactly why you're being overlooked — and fixes it so you land more interviews.",
    cta1: "Upload Your Resume — Free",
    cta2: "See How It Works",
    trust: ["No credit card required", "Results in 30 seconds", "No software to install"],
  },

  problem: {
    badge: "The Real Problem",
    h2: "Does this sound familiar?",
    sub: "Thousands of job seekers face this every single day",
    items: [
      {
        icon: "x",
        title: "Your resume is rejected before anyone reads it",
        desc: "Over 75% of resumes are filtered out by ATS software before they ever reach a human recruiter.",
      },
      {
        icon: "x",
        title: "You don't know what employers are looking for",
        desc: "Every job post contains specific keywords. If they're missing from your resume, so is your chance.",
      },
      {
        icon: "x",
        title: "You apply everywhere and hear back from nowhere",
        desc: "Hours spent sending applications into silence — no feedback, no direction, no idea what went wrong.",
      },
      {
        icon: "x",
        title: "Cover letters eat up your time",
        desc: "Writing a strong, tailored cover letter for each job is exhausting and takes time you could spend elsewhere.",
      },
    ],
    bridge: "Then came JobAI24",
    bridgeSub: "The tool that solves all of this in one step",
  },

  how: {
    badge: "Simple & Fast",
    h2: "Three steps to your next interview",
    sub: "From resume upload to confident application — in under five minutes",
    steps: [
      {
        num: "1",
        title: "Upload Your Resume",
        desc: "Upload a PDF or Word file. No account needed to get started and your results arrive instantly.",
      },
      {
        num: "2",
        title: "Get Instant AI Analysis",
        desc: "JobAI24 scans your resume, flags weaknesses, and pinpoints every missing keyword in seconds.",
      },
      {
        num: "3",
        title: "Apply With Confidence",
        desc: "Receive an enhanced resume, a tailored cover letter, and start getting interview invitations.",
      },
    ],
  },

  features: {
    badge: "What You Get",
    h2: "Everything you need, in one place",
    sub: "A complete toolkit built to get you hired faster",
    items: [
      {
        icon: "target",
        title: "ATS Resume Analysis",
        sub: "Know exactly why you're being rejected",
        desc: "Comprehensive analysis against 50+ ATS criteria with a precise match score and recommendations you can act on today.",
        bullets: ["Precise match score", "Keyword gap detection", "Instant recommendations"],
      },
      {
        icon: "sparkles",
        title: "AI Resume Enhancement",
        sub: "A resume worth reading",
        desc: "Professional rewriting that highlights your skills and achievements in language that attracts employers and outshines competition.",
        bullets: ["Professional, compelling language", "ATS-friendly formatting", "Download-ready output"],
      },
      {
        icon: "mail",
        title: "Cover Letter Generator",
        sub: "A tailored letter for every job in seconds",
        desc: "Intelligent cover letters crafted specifically for each role and company you target.",
        bullets: ["Job-specific tailoring", "Bilingual support", "Professional & persuasive"],
      },
      {
        icon: "brain",
        title: "Interview Preparation",
        sub: "Walk in ready to impress",
        desc: "Interview questions generated from your resume and target role, with AI-powered answer evaluation and improvement tips.",
        bullets: ["Personalized questions", "AI answer scoring", "Repeated practice mode"],
      },
      {
        icon: "trending",
        title: "Career Insights",
        sub: "Understand what the market wants from you",
        desc: "Compare your current skills against real market demand and get a clear roadmap to close the gaps and grow your career.",
        bullets: ["Skill gap analysis", "Market trend data", "Clear development roadmap"],
      },
    ],
  },

  smart: {
    badge: "Exclusive Feature",
    h2: "Smart CV Marketing",
    sub: "Stop waiting for job postings — reach employers directly",
    desc: "Instead of waiting for the right listing, JobAI24 launches a targeted outreach campaign that connects your resume with the right employers automatically.",
    steps: [
      { num: "1", title: "Upload your CV and select your target role" },
      { num: "2", title: "JobAI24 identifies the right employers for your profile" },
      { num: "3", title: "A professional, personalized outreach campaign launches in your name" },
    ],
    benefits: [
      "Reach hundreds of relevant employers",
      "Save hours of manual applications",
      "Personalized, professional outreach messages",
      "Track your campaign performance in real time",
      "Meaningfully increase your interview opportunities",
    ],
    cta: "Start Your Free Campaign",
    ctaNote: "Available with a free account — no credit card required",
  },

  benefits: {
    badge: "Why JobAI24",
    h2: "What you'll actually gain",
    sub: "Real outcomes for ambitious job seekers",
    items: [
      {
        icon: "clock",
        title: "Save Time",
        desc: "What used to take hours now takes minutes. Spend your time on opportunities that deserve it.",
      },
      {
        icon: "trending",
        title: "Apply Smarter",
        desc: "Target the right roles with a resume and cover letter optimized for each specific opportunity.",
      },
      {
        icon: "shield",
        title: "Build Confidence",
        desc: "Understand your strengths and how to articulate them. Walk into interviews grounded and prepared.",
      },
      {
        icon: "star",
        title: "Stand Out",
        desc: "Professional design and copy that places you at the top of the pile and gets attention.",
      },
      {
        icon: "users",
        title: "Wider Reach",
        desc: "Smart Marketing connects you with employers you'd never discover on traditional job boards.",
      },
      {
        icon: "rocket",
        title: "Keep Growing",
        desc: "Continuous career insights to help you stay ahead of the market and develop the right skills.",
      },
    ],
  },

  testimonials: {
    badge: "What People Say",
    h2: "Real stories from JobAI24 users",
    sub: "From people who used JobAI24 to land their next role",
    items: [
      {
        initials: "F.A",
        name: "Fatima Al-Omari",
        role: "Digital Marketing",
        text: "I had been applying for months with no response. JobAI24 showed me my resume was being filtered out automatically. After the improvements, I got two interview invitations in under a week.",
      },
      {
        initials: "A.K",
        name: "Ahmed Al-Khalidi",
        role: "Software Engineering",
        text: "The analysis flagged critical skills that were completely absent from my resume. The recommendations were precise and logical — not just random additions. The difference in responses I get now is real.",
      },
      {
        initials: "S.R",
        name: "Sarah Al-Rashid",
        role: "Accounting & Finance",
        text: "Writing a proper cover letter used to take me an hour per application. Now I have a tailored, professional letter in five minutes. The time I've saved is hard to overstate.",
      },
    ],
  },

  cta: {
    badge: "Start Free Today",
    h2: "Don't let your resume get lost in the pile",
    sub: "Upload your resume in seconds and take the first step toward your next opportunity.",
    cta1: "Upload My Resume Now",
    cta2: "Create Free Account",
    trust: ["No credit card required", "Instant results", "Secure & encrypted"],
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Page                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;

  return (
    <>
      <HeroSection t={t.hero} isAr={isAr} />
      <ProblemSection t={t.problem} isAr={isAr} />
      <HowItWorksSection t={t.how} isAr={isAr} />
      <FeaturesSection t={t.features} isAr={isAr} />
      <SmartMarketingSection t={t.smart} isAr={isAr} />
      <BenefitsSection t={t.benefits} isAr={isAr} />
      <TestimonialsSection t={t.testimonials} isAr={isAr} />
      <FinalCTASection t={t.cta} isAr={isAr} />
    </>
  );
}
