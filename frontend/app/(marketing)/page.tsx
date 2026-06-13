"use client";

import { useLocale } from "next-intl";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSection } from "@/components/marketing/problem-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { AudienceSection } from "@/components/marketing/audience-section";
import { BlogTeaserSection } from "@/components/marketing/blog-teaser-section";
import { FinalCTASection } from "@/components/marketing/final-cta-section";

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Arabic content                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

const AR = {
  hero: {
    h1: "احصل على وظيفتك القادمة",
    h1Highlight: "بذكاء أكبر",
    badge: "منصة مهنية بالذكاء الاصطناعي",
    sub: "منصة JobAI24 تساعدك على تحسين سيرتك الذاتية والتقديم بذكاء والاستعداد للمقابلات لزيادة فرص حصولك على مقابلات وعروض وظيفية.",
    cta1: "ابدأ مجاناً",
    cta2: "كيف يعمل؟",
    trust: ["لا حاجة لبطاقة ائتمانية", "نتائج فورية", "مخصص للسوق الخليجي"],
  },

  problem: {
    badge: "المشكلة الحقيقية",
    h2: "لماذا لا تحصل على رد من أصحاب العمل؟",
    sub: "قد تكون المشكلة ليست في خبراتك.",
    items: [
      {
        icon: "x",
        title: "سيرة ذاتية غير متوافقة مع أنظمة الفرز ATS",
        desc: "أكثر من ٧٥٪ من السير الذاتية تُصفّى آلياً قبل أن تصل إلى أي مسؤول توظيف.",
      },
      {
        icon: "x",
        title: "كلمات مفتاحية مفقودة",
        desc: "كل إعلان وظيفة يتضمن كلمات مفتاحية محددة — إذا غابت عن سيرتك، غابت فرصتك معها.",
      },
      {
        icon: "x",
        title: "عرض غير احترافي للخبرات والمهارات",
        desc: "طريقة عرض خبراتك تحدد الفرق بين أن تُقرأ سيرتك أو تُتجاهل.",
      },
      {
        icon: "x",
        title: "ضعف رسائل التقديم",
        desc: "رسالة تقديم غير مخصصة تُفقدك الفرصة قبل أن يطّلع أحد على سيرتك.",
      },
      {
        icon: "x",
        title: "عدم الاستعداد الجيد للمقابلات",
        desc: "الاستعداد الضعيف يضيّع فرصاً كانت في متناولك.",
      },
    ],
    bridge: "لهذا السبب تم إنشاء JobAI24",
    bridgeSub: "الأداة التي تحل كل هذه المشاكل في رحلة واحدة متكاملة",
  },

  features: {
    badge: "خدماتنا",
    h2: "كل ما تحتاجه للحصول على وظيفة في منصة واحدة",
    sub: "بدلاً من استخدام عشرات الأدوات المختلفة، يوفر لك JobAI24 رحلة متكاملة تبدأ من السيرة الذاتية وتنتهي بالمقابلة الوظيفية.",
    items: [
      {
        icon: "target",
        title: "تحليل السيرة الذاتية بالذكاء الاصطناعي",
        sub: "اكتشف أسباب رفض سيرتك الذاتية",
        desc: "ارفع سيرتك واحصل على تحليل شامل يوضح أسباب الرفض وفرص التحسين الفورية.",
        bullets: ["نقاط القوة والضعف", "توافق السيرة مع أنظمة ATS", "الكلمات المفتاحية المفقودة", "فرص التحسين الفورية"],
      },
      {
        icon: "sparkles",
        title: "تحسين السيرة الذاتية",
        sub: "حوّل سيرتك إلى نسخة أكثر احترافية",
        desc: "يساعدك JobAI24 على إعادة صياغة سيرتك لإبراز خبراتك وزيادة فرص ظهورها أمام مسؤولي التوظيف.",
        bullets: ["تحسين المحتوى والصياغة", "إبراز الخبرات والإنجازات", "تحسين الكلمات المفتاحية", "رفع فرص الظهور أمام أصحاب العمل"],
      },
      {
        icon: "brain",
        title: "التدريب على المقابلات",
        sub: "تدرّب قبل المقابلة الحقيقية",
        desc: "استعد بثقة من خلال محاكاة مقابلات واقعية مع تقييم فوري للإجابات واقتراحات للتحسين.",
        bullets: ["أسئلة مخصصة لكل وظيفة", "محاكاة مقابلات واقعية", "تقييم فوري للإجابات", "اقتراحات عملية للتحسين"],
      },
      {
        icon: "mail",
        title: "التقديم الذكي على الوظائف",
        sub: "وفّر الوقت وقدّم باحترافية",
        desc: "أنشئ رسائل تقديم احترافية مخصصة لكل وظيفة خلال دقائق. لا مزيد من النسخ واللصق.",
        bullets: ["رسائل مخصصة لكل وظيفة", "لا مزيد من النسخ واللصق", "احترافية وإقناع في كل رسالة"],
      },
      {
        icon: "trending",
        title: "مطابقة الوظائف",
        sub: "اعثر على الوظائف المناسبة لمؤهلاتك",
        desc: "يحلل النظام خبراتك ومهاراتك ويساعدك على اكتشاف الفرص الأكثر توافقاً مع ملفك المهني.",
        bullets: ["تحليل الخبرات والمهارات", "اكتشاف الفرص المناسبة", "توافق دقيق مع ملفك المهني"],
      },
    ],
  },

  how: {
    badge: "كيف يعمل",
    h2: "خمس خطوات إلى وظيفتك القادمة",
    sub: "رحلة متكاملة من رفع السيرة إلى التقديم بثقة",
    steps: [
      { num: "١", title: "ارفع سيرتك الذاتية", desc: "ارفع ملف PDF أو Word وابدأ رحلتك فوراً." },
      { num: "٢", title: "احصل على تحليل شامل", desc: "تحليل دقيق بالذكاء الاصطناعي مع توصيات واضحة وقابلة للتنفيذ." },
      { num: "٣", title: "حسّن سيرتك وخطاباتك", desc: "أعِد صياغة سيرتك وأنشئ خطابات تقديم مخصصة لكل وظيفة." },
      { num: "٤", title: "تدرّب على المقابلات", desc: "محاكاة مقابلات واقعية لتدخل المقابلة الحقيقية بثقة أكبر." },
      { num: "٥", title: "قدّم بذكاء واحصل على فرصتك", desc: "قدّم على الوظائف المناسبة بأدوات ذكية توصلك لنتائج أفضل." },
    ],
  },

  benefits: {
    badge: "لماذا JobAI24",
    h2: "لماذا يختار الباحثون عن عمل JobAI24؟",
    sub: "منصة مصممة خصيصاً لاحتياجات سوق العمل السعودي والخليجي",
    items: [
      { icon: "users",    title: "واجهة سهلة باللغة العربية",      desc: "تجربة استخدام سلسة وسهلة مصممة بالكامل للمستخدم العربي." },
      { icon: "star",     title: "مدعوم بالذكاء الاصطناعي",        desc: "أحدث تقنيات الذكاء الاصطناعي لتحليل دقيق وتوصيات ذكية." },
      { icon: "trending", title: "مخصص لسوق العمل الخليجي",       desc: "معايير وتوقعات سوق العمل السعودي والخليجي في صميم كل أداة." },
      { icon: "shield",   title: "تحسين متوافق مع أنظمة ATS",      desc: "كل تحسين مبني على معايير أنظمة الفرز الفعلية المستخدمة في المنطقة." },
      { icon: "clock",    title: "توفير الوقت والجهد",              desc: "ما كان يستغرق ساعات أصبح يتم في دقائق مع نتائج أفضل." },
      { icon: "rocket",   title: "تطوير مستمر",                     desc: "المنصة تتطور باستمرار بناءً على احتياجات الباحثين عن عمل." },
    ],
  },

  audience: {
    badge: "لمن هذه المنصة",
    h2: "مناسب لجميع الباحثين عن عمل",
    sub: "سواء كنت خريجاً جديداً أو صاحب خبرة تبحث عن فرصة أفضل",
    items: [
      { icon: "graduation", label: "الخريجون الجدد" },
      { icon: "search",     label: "الباحثون عن أول وظيفة" },
      { icon: "trending",   label: "الموظفون الراغبون في تطوير مسارهم المهني" },
      { icon: "award",      label: "المتخصصون وأصحاب الخبرات" },
      { icon: "globe",      label: "الباحثون عن فرص أفضل داخل المملكة وخارجها" },
    ],
  },

  cta: {
    badge: "ابدأ مجاناً",
    h2: "ابدأ رحلتك المهنية بثقة أكبر",
    sub: "كل وظيفة تبدأ بسيرة ذاتية قوية واستعداد أفضل. دع JobAI24 يساعدك على اكتشاف نقاط التحسين والتقديم بذكاء.",
    cta1: "ابدأ مجاناً الآن",
    cta2: "تعرف على المنصة",
    trust: ["لا حاجة لبطاقة ائتمانية للبدء", "نتائج فورية", "آمن ومشفّر"],
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  English content                                                            */
/* ─────────────────────────────────────────────────────────────────────────── */

const EN = {
  hero: {
    h1: "Land Your Next Job",
    h1Highlight: "Smarter",
    badge: "AI Career Platform · Built for Gulf Job Seekers",
    sub: "JobAI24 helps you improve your resume, apply smarter, and prepare for interviews — so you get more interview invitations and job offers.",
    cta1: "Get Started Free",
    cta2: "See How It Works",
    trust: ["No credit card required", "Instant results", "Built for the Gulf market"],
  },

  problem: {
    badge: "The Real Problem",
    h2: "Why aren't employers responding?",
    sub: "The problem might not be your experience.",
    items: [
      {
        icon: "x",
        title: "Resume not compatible with ATS screening systems",
        desc: "Over 75% of resumes are filtered out automatically before any recruiter ever sees them.",
      },
      {
        icon: "x",
        title: "Missing keywords",
        desc: "Every job post has specific keywords. If they're missing from your resume, so is your opportunity.",
      },
      {
        icon: "x",
        title: "Unprofessional presentation of experience and skills",
        desc: "How you present your experience determines whether your resume gets read or ignored.",
      },
      {
        icon: "x",
        title: "Weak application messages",
        desc: "A generic cover letter costs you the opportunity before anyone even reads your resume.",
      },
      {
        icon: "x",
        title: "Poor interview preparation",
        desc: "Weak preparation wastes opportunities that were within your reach.",
      },
    ],
    bridge: "That's why we built JobAI24",
    bridgeSub: "The tool that solves all of this in one integrated journey",
  },

  features: {
    badge: "Our Services",
    h2: "Everything you need to get a job — in one platform",
    sub: "Instead of juggling dozens of tools, JobAI24 gives you an integrated journey from resume to interview.",
    items: [
      {
        icon: "target",
        title: "AI Resume Analysis",
        sub: "Discover why your resume is being rejected",
        desc: "Upload your resume and get a comprehensive analysis revealing weaknesses and immediate improvement opportunities.",
        bullets: ["Strengths and weaknesses", "ATS compatibility score", "Missing keywords", "Immediate improvement opportunities"],
      },
      {
        icon: "sparkles",
        title: "Resume Enhancement",
        sub: "Transform your resume into a more professional version",
        desc: "JobAI24 helps you rewrite your resume to showcase your experience and increase visibility with recruiters.",
        bullets: ["Content and phrasing improvement", "Highlighting experience and achievements", "Keyword optimization", "Increased employer visibility"],
      },
      {
        icon: "brain",
        title: "Interview Training",
        sub: "Practice before the real interview",
        desc: "Prepare with confidence through realistic interview simulations with instant answer evaluation.",
        bullets: ["Job-specific questions", "Realistic interview simulations", "Instant answer evaluation", "Practical improvement suggestions"],
      },
      {
        icon: "mail",
        title: "Smart Job Applications",
        sub: "Save time and apply professionally",
        desc: "Create professional, tailored cover letters for each job in minutes. No more copy-pasting.",
        bullets: ["Customized for each job", "No more copy-pasting", "Professional and persuasive every time"],
      },
      {
        icon: "trending",
        title: "Job Matching",
        sub: "Find jobs that match your qualifications",
        desc: "The system analyzes your experience and skills to help you discover the most relevant opportunities.",
        bullets: ["Experience and skills analysis", "Discover matching opportunities", "Precise fit with your profile"],
      },
    ],
  },

  how: {
    badge: "How It Works",
    h2: "Five steps to your next job",
    sub: "An integrated journey from resume upload to applying with confidence",
    steps: [
      { num: "1", title: "Upload Your Resume", desc: "Upload a PDF or Word file and start your journey instantly." },
      { num: "2", title: "Get a Comprehensive Analysis", desc: "Precise AI analysis with clear, actionable recommendations." },
      { num: "3", title: "Improve Your Resume & Cover Letters", desc: "Rewrite your resume and create tailored cover letters for each role." },
      { num: "4", title: "Practice Interviews", desc: "Realistic interview simulations so you walk in more confident." },
      { num: "5", title: "Apply Smarter & Get Hired", desc: "Apply to the right opportunities with smart tools that deliver results." },
    ],
  },

  benefits: {
    badge: "Why JobAI24",
    h2: "Why job seekers choose JobAI24",
    sub: "A platform designed specifically for Saudi and Gulf job market needs",
    items: [
      { icon: "users",    title: "Easy Arabic Interface",        desc: "A smooth, simple experience designed entirely for Arabic-speaking users." },
      { icon: "star",     title: "Powered by AI",                desc: "Latest AI technology for precise analysis and smart recommendations." },
      { icon: "trending", title: "Built for the Gulf Market",    desc: "Saudi and Gulf job market standards at the core of every tool." },
      { icon: "shield",   title: "ATS-Compatible Optimization",  desc: "Every improvement built on the actual screening criteria used in the region." },
      { icon: "clock",    title: "Saves Time & Effort",          desc: "What used to take hours now takes minutes — with better results." },
      { icon: "rocket",   title: "Continuously Improving",       desc: "The platform constantly evolves based on job seeker needs." },
    ],
  },

  audience: {
    badge: "Who It's For",
    h2: "Built for every job seeker",
    sub: "Whether you're a fresh graduate or an experienced professional seeking a better opportunity",
    items: [
      { icon: "graduation", label: "Fresh graduates" },
      { icon: "search",     label: "First-time job seekers" },
      { icon: "trending",   label: "Employees looking to advance their careers" },
      { icon: "award",      label: "Specialists and experienced professionals" },
      { icon: "globe",      label: "Those seeking opportunities in Saudi Arabia and beyond" },
    ],
  },

  cta: {
    badge: "Start Free Today",
    h2: "Start your career journey with more confidence",
    sub: "Every job starts with a strong resume and better preparation. Let JobAI24 help you discover improvement areas and apply smarter.",
    cta1: "Get Started Free Now",
    cta2: "Learn About the Platform",
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
      <FeaturesSection t={t.features} isAr={isAr} />
      <HowItWorksSection t={t.how} isAr={isAr} />
      <BenefitsSection t={t.benefits} isAr={isAr} />
      <AudienceSection t={t.audience} isAr={isAr} />
      <BlogTeaserSection isAr={isAr} />
      <FinalCTASection t={t.cta} isAr={isAr} />
    </>
  );
}
