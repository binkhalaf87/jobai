import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { CheckCircle2, X } from "lucide-react";
import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "التقديم الذكي على الوظائف — JobAI24"
      : "Smart Job Applications — JobAI24",
    description: isAr
      ? "لا تنتظر الوظائف — اصنع فرصك بنفسك. أنشئ حملات تقديم احترافية توصل سيرتك لجهات التوظيف المناسبة برسائل مخصصة."
      : "Don't wait for job posts — create your own opportunities. Launch professional outreach campaigns that deliver your CV to the right employers with personalized messages.",
  };
}

const AR = {
  hero: {
    badge: "التقديم الذكي على الوظائف",
    h1: "لا تنتظر الوظائف...",
    h1Highlight: "اصنع فرصك بنفسك",
    sub: "المرشحون الأذكى لا ينتظرون نشر الإعلان. يصلون إلى صانعي القرار مباشرة.",
    cta: "ابدأ حملة التقديم الآن",
  },
  narrative: {
    p1: "معظم الباحثين عن عمل يجلسون ينتظرون نشر الوظائف. ينتظرون الإعلان، ينتظرون الرد، ينتظرون الفرصة.",
    p2: "لكن الفرص النادرة والمراكز المميزة كثيراً ما تُملأ قبل أن يُعلَن عنها. الشركات تُفضّل التوظيف عبر الشبكات والتوصيات والمرشحين الذين يُبادرون — لأن المبادرة نفسها تكشف عن المهارات التي تريدها في موظفيها.",
    bridge: "حوّل انتظارك إلى حركة",
  },
  reach: {
    title: "دع سيرتك الذاتية تعمل بينما تركز أنت على مستقبلك",
    p1: "JobAI24 يساعدك على إنشاء وإدارة حملات تقديم احترافية — رسائل مخصصة لكل شركة أو جهة توظيف تستهدفها، مع متابعة منظّمة لكل خطوة.",
    p2: "بدلاً من إرسال نفس الرسالة العامة للجميع وانتظار معجزة، تحصل على رسائل مُصممة تُظهر اهتمامك الحقيقي بكل جهة — وهذا وحده يجعلك تبرز بين عشرات المتقدمين.",
  },
  oldway: {
    title: "ما كنت تفعله يدوياً... أصبح يتم بذكاء",
    sub: "ما كان يستغرق ساعات أصبح يتم في دقائق:",
    items: [
      "البحث عن معلومات الشركة وتخصيص كل رسالة يدوياً",
      "نسخ ولصق معلومات الاتصال من مصادر متعددة",
      "متابعة كل تقديم في ملف Excel منفصل",
      "كتابة رسائل متكررة بأسلوب مختلف لكل مرسَل إليه",
    ],
  },
  urgency: {
    title: "لأن الفرص لا تأتي دائماً لمن ينتظر",
    p1: "الشركات التي تبحث عن موهبة معينة لا تنشر دائماً إعلاناً رسمياً. أحياناً تبدأ بالبحث في شبكاتها وبين من تقدموا بمبادرتهم.",
    p2: "وجود سيرتك الذاتية عند الشخص الصحيح، في الوقت الصحيح، هو ما يُحوّل 'ربما لاحقاً' إلى 'يمكنك البدء الأسبوع القادم'.",
  },
  outcome: {
    title: "لا مزيد من الانتظار السلبي",
    nots: [
      "لا مزيد من التحديق في صفحات الوظائف يومياً دون نتيجة",
      "لا مزيد من الرسائل العامة التي يتجاهلها الجميع",
      "لا مزيد من الشعور بأنك تفقد السيطرة على مسار توظيفك",
    ],
    goal: "أنت من يصنع الفرصة — لا من ينتظرها",
    cta: "ابدأ حملة التقديم الذكي الآن",
    trust: ["مجاني للبدء", "حملات مخصصة", "لا بطاقة ائتمانية"],
  },
};

const EN = {
  hero: {
    badge: "Smart Job Applications",
    h1: "Don't wait for jobs...",
    h1Highlight: "create your own opportunities",
    sub: "Smart candidates don't wait for job posts. They reach decision-makers directly.",
    cta: "Launch Your Outreach Campaign",
  },
  narrative: {
    p1: "Most job seekers sit and wait for job postings. They wait for the announcement, wait for a reply, wait for the opportunity.",
    p2: "But rare opportunities and coveted positions are often filled before they're ever posted. Companies prefer hiring through networks, referrals, and proactive candidates — because that initiative itself reveals the very skills they want in their employees.",
    bridge: "Turn your waiting into action",
  },
  reach: {
    title: "Let your resume work while you focus on your future",
    p1: "JobAI24 helps you create and manage professional outreach campaigns — personalized messages for each company or hiring contact you target, with organized follow-up tracking for every step.",
    p2: "Instead of sending the same generic message to everyone and hoping for a miracle, you get crafted messages that show your genuine interest in each organization — and that alone makes you stand out among dozens of applicants.",
  },
  oldway: {
    title: "What you used to do manually... now done smartly",
    sub: "What used to take hours now takes minutes:",
    items: [
      "Researching company information and manually personalizing each message",
      "Copying and pasting contact information from multiple sources",
      "Tracking each application in a separate Excel file",
      "Writing repetitive messages in different styles for each recipient",
    ],
  },
  urgency: {
    title: "Because opportunities don't always come to those who wait",
    p1: "Companies looking for a specific talent don't always post a formal job listing. Sometimes they start by searching their networks and among those who reached out proactively.",
    p2: "Having your resume with the right person at the right time is what turns 'maybe later' into 'you can start next week'.",
  },
  outcome: {
    title: "No more passive waiting",
    nots: [
      "No more staring at job boards daily without results",
      "No more generic messages that everyone ignores",
      "No more feeling like you've lost control of your job search",
    ],
    goal: "You create the opportunity — you don't wait for it",
    cta: "Launch Your Smart Application Campaign Now",
    trust: ["Free to start", "Personalized campaigns", "No credit card"],
  },
};

export default async function SmartSendPage() {
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

      {/* ── More reach, less effort ── */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`text-3xl font-black tracking-tight text-slate-950 md:text-4xl ${isAr ? "text-right" : "text-left"}`}>
            {t.reach.title}
          </h2>
          <div className={`mt-8 space-y-5 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-lg leading-relaxed text-slate-600">{t.reach.p1}</p>
            <p className="text-lg font-semibold leading-relaxed text-slate-800">
              {t.reach.p2}
            </p>
          </div>
        </div>
      </section>

      {/* ── Old way vs new way ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className={isAr ? "text-right" : "text-left"}>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.oldway.title}
            </h2>
            <p className="mt-3 text-lg text-slate-500">{t.oldway.sub}</p>
            <ul className="mt-10 space-y-4">
              {t.oldway.items.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}
                >
                  <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 ${isAr ? "" : ""}`}>
                    <X className="h-3 w-3 text-red-400" />
                  </span>
                  <span className="text-base leading-relaxed text-slate-500 line-through decoration-slate-300 md:text-lg">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Opportunities don't wait ── */}
      <section className="bg-brand-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`text-3xl font-black tracking-tight text-white md:text-4xl ${isAr ? "text-right" : "text-left"}`}>
            {t.urgency.title}
          </h2>
          <div className={`mt-8 space-y-5 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-lg leading-relaxed text-brand-100">{t.urgency.p1}</p>
            <p className="text-lg font-semibold leading-relaxed text-white">
              {t.urgency.p2}
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
