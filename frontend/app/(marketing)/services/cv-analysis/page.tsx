import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "تحليل السيرة الذاتية — JobAI24"
      : "CV Analysis — JobAI24",
    description: isAr
      ? "اكتشف لماذا لا تحصل على مقابلات وظيفية. تحليل شامل بالذكاء الاصطناعي يكشف نقاط الضعف والكلمات المفتاحية المفقودة ودرجة التوافق مع أنظمة ATS."
      : "Discover why you're not getting interview calls. Comprehensive AI analysis revealing weak points, missing keywords, and your ATS compatibility score.",
  };
}

const AR = {
  hero: {
    badge: "تحليل السيرة الذاتية",
    h1: "لماذا لا تحصل على",
    h1Highlight: "مقابلات وظيفية؟",
    sub: "هل أرسلت عشرات الطلبات ولم يصلك أي رد؟ قد تكون المشكلة ليست في خبراتك.",
    cta: "حلل سيرتي الذاتية مجاناً",
  },
  narrative: {
    p1: "لست وحدك. آلاف الباحثين عن عمل يمتلكون المهارات والخبرات المناسبة، لكنهم لا يحصلون على المقابلات لأن سيرهم الذاتية لا تصل إلى مسؤولي التوظيف أصلاً.",
    p2: "أكثر من ٧٥٪ من السير الذاتية تُصفّى تلقائياً بواسطة أنظمة الفرز الآلي قبل أن تراها أي عين بشرية. هذه الأنظمة تبحث عن كلمات مفتاحية محددة وتنسيق معين — وإذا لم تستوفِ هذه الشروط، لا يرى أحد سيرتك مهما كانت خبرتك رائعة.",
    bridge: "لهذا تم تطوير JobAI24",
  },
  bullets: {
    title: "لا تحصل على تخمينات... احصل على إجابات",
    sub: "JobAI24 لا يعطيك نصائح عامة — يشرح لك بالضبط:",
    items: [
      "ما مدى توافق سيرتك مع أنظمة ATS الفعلية المستخدمة في المنطقة",
      "الكلمات المفتاحية المهمة التي تغيب عن سيرتك مقارنة بالوظيفة المستهدفة",
      "نقاط القوة في سيرتك التي يجب إبرازها",
      "نقاط الضعف التي تسبب الرفض الآلي فوراً",
      "الإجراءات المحددة التي يمكنك اتخاذها لتحسين سيرتك اليوم",
    ],
  },
  why: {
    title: "لأن الحصول على وظيفة يبدأ بسيرة ذاتية قوية",
    p1: "قبل المقابلة، قبل خطاب التقديم، قبل أي شيء — هناك قرار أول يتخذه نظام فرز أو مسؤول توظيف في أقل من ٧ ثوانٍ.",
    p2: "سيرتك الذاتية ليست مجرد وثيقة تُدرج فيها تاريخك المهني — إنها أداة تسويق لنفسك. وكأي أداة تسويقية، يجب أن تكون مصممة بعناية لجذب الانتباه والإقناع.",
    p3: "الفرق بين سيرة ذاتية تُصفّى آلياً وسيرة تصل إلى المقابلة قد لا يكون في الخبرة نفسها — بل في طريقة تقديمها.",
  },
  outcome: {
    title: "النتيجة التي تبحث عنها",
    nots: [
      "ليس تقريراً تقرأه وتنساه",
      "ليست درجة لا تعرف ماذا تفعل بها",
      "ليست نصيحة عامة لا تنطبق على حالتك",
    ],
    goal: "الهدف الحقيقي هو زيادة فرص حصولك على مقابلات وظيفية",
    cta: "ابدأ تحليل سيرتك الآن",
    trust: ["مجاني للبدء", "نتائج فورية", "لا بطاقة ائتمانية"],
  },
};

const EN = {
  hero: {
    badge: "CV Analysis",
    h1: "Why aren't you getting",
    h1Highlight: "interview calls?",
    sub: "Have you sent dozens of applications without hearing back? The problem might not be your experience.",
    cta: "Analyze My Resume Free",
  },
  narrative: {
    p1: "You're not alone. Thousands of job seekers have the right skills and experience but never get interviews — because their resumes never reach a human recruiter in the first place.",
    p2: "Over 75% of resumes are automatically filtered out by Applicant Tracking Systems (ATS) before any human sees them. These systems scan for specific keywords and formatting — and if your resume doesn't meet those criteria, no one sees it no matter how impressive your background is.",
    bridge: "That's why we built JobAI24",
  },
  bullets: {
    title: "No guesses... get real answers",
    sub: "JobAI24 doesn't give you generic advice — it tells you exactly:",
    items: [
      "How compatible your resume is with the ATS systems actually used in the region",
      "The important keywords missing from your resume compared to your target role",
      "The strengths in your resume that need to be highlighted",
      "The weaknesses causing immediate automatic rejection",
      "The specific actions you can take to improve your resume today",
    ],
  },
  why: {
    title: "Because getting a job starts with a strong resume",
    p1: "Before the interview, before the cover letter, before anything — there's a first decision made by a screening system or recruiter in under 7 seconds.",
    p2: "Your resume isn't just a document listing your professional history — it's a marketing tool for yourself. And like any marketing tool, it needs to be carefully crafted to capture attention and persuade.",
    p3: "The difference between a resume that gets filtered out and one that lands an interview may not be in the experience itself — but in how that experience is presented.",
  },
  outcome: {
    title: "The result you're looking for",
    nots: [
      "Not a report you read and forget",
      "Not a score you don't know what to do with",
      "Not generic advice that doesn't apply to your situation",
    ],
    goal: "The real goal is more interview invitations",
    cta: "Start Analyzing Your Resume Now",
    trust: ["Free to start", "Instant results", "No credit card"],
  },
};

export default async function CvAnalysisPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div dir={dir}>
      {/* ── Hero ── */}
      <section className="relative bg-slate-950 pb-24 pt-16 md:pb-32 md:pt-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-600/10 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <SectionBadge className="border-brand-500/30 bg-brand-500/10 text-brand-300">
            {t.hero.badge}
          </SectionBadge>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            {t.hero.h1}{" "}
            <span className="bg-gradient-to-r from-teal to-brand-400 bg-clip-text text-transparent">
              {t.hero.h1Highlight}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            {t.hero.sub}
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-teal px-8 py-4 text-sm font-bold text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/25 active:scale-[0.98]"
            >
              {t.hero.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Narrative ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <p className={`text-lg leading-relaxed text-slate-600 md:text-xl ${isAr ? "text-right" : "text-left"}`}>
            {t.narrative.p1}
          </p>
          <p className={`mt-6 text-lg leading-relaxed text-slate-600 md:text-xl ${isAr ? "text-right" : "text-left"}`}>
            {t.narrative.p2}
          </p>
          <div className={`mt-10 border-t border-slate-100 pt-10 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-2xl font-black text-slate-950 md:text-3xl">
              {t.narrative.bridge}
            </p>
          </div>
        </div>
      </section>

      {/* ── What we discover ── */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className={isAr ? "text-right" : "text-left"}>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.bullets.title}
            </h2>
            <p className="mt-3 text-lg text-slate-500">{t.bullets.sub}</p>
            <ul className="mt-10 space-y-4">
              {t.bullets.items.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                  <span className="text-base leading-relaxed text-slate-700 md:text-lg">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Why it matters ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`text-3xl font-black tracking-tight text-slate-950 md:text-4xl ${isAr ? "text-right" : "text-left"}`}>
            {t.why.title}
          </h2>
          <div className={`mt-8 space-y-5 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-lg leading-relaxed text-slate-600">{t.why.p1}</p>
            <p className="text-lg leading-relaxed text-slate-600">{t.why.p2}</p>
            <p className="text-lg font-semibold leading-relaxed text-slate-800">
              {t.why.p3}
            </p>
          </div>
        </div>
      </section>

      {/* ── Outcome + CTA ── */}
      <section className="bg-slate-950 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-black text-white md:text-4xl">
            {t.outcome.title}
          </h2>
          <ul className="mt-10 space-y-3">
            {t.outcome.nots.map((item, i) => (
              <li key={i} className="text-lg text-slate-500 line-through decoration-slate-600">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-xl font-black text-teal md:text-2xl">
            {t.outcome.goal}
          </p>
          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-teal px-8 py-4 text-sm font-bold text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/25"
            >
              {t.outcome.cta}
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-5">
            {t.outcome.trust.map((item) => (
              <div key={item} className={`flex items-center gap-1.5 ${isAr ? "flex-row-reverse" : ""}`}>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal/60" />
                <span className="text-xs text-slate-500">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
