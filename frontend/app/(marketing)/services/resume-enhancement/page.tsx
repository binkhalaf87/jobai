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
      ? "تحسين السيرة الذاتية — JobAI24"
      : "Resume Enhancement — JobAI24",
    description: isAr
      ? "حوّل سيرتك الذاتية إلى أداة تفتح لك أبواب الفرص. إعادة صياغة احترافية بالذكاء الاصطناعي تُبرز إنجازاتك وتتجاوز أنظمة الفرز."
      : "Transform your resume into a door-opener. Professional AI rewriting that highlights your achievements and beats ATS filters.",
  };
}

const AR = {
  hero: {
    badge: "تحسين السيرة الذاتية",
    h1: "حوّل سيرتك الذاتية إلى",
    h1Highlight: "أداة تفتح لك أبواب الفرص",
    sub: "سيرتك الذاتية قد تكون جيدة. لكن هل هي بائعة؟",
    cta: "حسّن سيرتي الآن",
  },
  narrative: {
    p1: "معظم السير الذاتية تروي قصة صاحبها. السير الذاتية الناجحة تبيع قيمته.",
    p2: "الفرق ليس في الخبرة ذاتها — بل في طريقة تقديمها. جملة واحدة مصاغة بشكل أفضل يمكن أن تحول مهمة روتينية إلى إنجاز يلفت الانتباه. وكلمة مفتاحية واحدة مضافة في المكان الصحيح قد تكون الفرق بين أن تُقرأ سيرتك أو تُرمى في سلة المهملات الرقمية.",
    bridge: "لا تدع خبراتك تضيع داخل سيرة ذاتية ضعيفة",
  },
  bullets: {
    title: "ما الذي نحسّنه بالضبط؟",
    sub: "الذكاء الاصطناعي لا يُعيد كتابة سيرتك — يُعيد بناء أثرها:",
    items: [
      "إعادة صياغة المهام والمسؤوليات لتُبرز الأثر والإنجاز بدلاً من مجرد الوصف",
      "إضافة الكلمات المفتاحية المناسبة للمجال والوظيفة المستهدفة",
      "تقوية ملخص الملف الشخصي ليُقنع في الثواني الأولى",
      "ترتيب المحتوى بأسلوب يُسهل القراءة السريعة لمسؤولي التوظيف",
    ],
  },
  why: {
    title: "اجعل كل سطر يعمل لصالحك",
    p1: "الذكاء الاصطناعي في JobAI24 لا يُضيف كلاماً فارغاً — يُحلّل سيرتك الحالية، ويقارنها بمتطلبات الوظيفة، ويُعيد كتابة كل جزء بأسلوب يُقنع أنظمة الفرز ويُقنع مسؤول التوظيف في آنٍ واحد.",
    p2: "النتيجة ليست سيرة ذاتية جديدة — بل هي أنت في أفضل صورة احترافية ممكنة.",
  },
  why2: {
    title: "لأن أصحاب العمل لا يملكون الوقت",
    p1: "في المتوسط، يقضي مسؤول التوظيف ٧ ثوانٍ فقط في النظر إلى سيرة ذاتية لأول مرة.",
    p2: "في هذه الثواني السبع، تحدث ثلاثة أسئلة بشكل شبه فوري: هل هذا الشخص مؤهل؟ هل تُبرز سيرته إنجازات واضحة؟ هل يستحق الوقت لقراءة المزيد؟",
    p3: "سيرتك الذاتية المُحسَّنة بـ JobAI24 مصممة للإجابة على هذه الأسئلة الثلاثة بـ «نعم» في الثواني الأولى.",
  },
  outcome: {
    title: "الفرق الذي تشعر به",
    nots: [
      "ليست ترجمة حرفية لما كتبته",
      "ليست إضافة كلمات رنانة فارغة",
      "ليست سيرة عامة تصلح لكل الوظائف",
    ],
    goal: "نسخة مُحسَّنة منك — مقنعة، موجّهة، وجاهزة للمقابلات",
    cta: "احصل على سيرة ذاتية أقوى اليوم",
    trust: ["مجاني للبدء", "نتائج فورية", "لا بطاقة ائتمانية"],
  },
};

const EN = {
  hero: {
    badge: "Resume Enhancement",
    h1: "Turn your resume into",
    h1Highlight: "a tool that opens doors",
    sub: "Your resume might be good. But is it selling you?",
    cta: "Enhance My Resume Now",
  },
  narrative: {
    p1: "Most resumes tell a story. Successful resumes sell value.",
    p2: "The difference isn't in the experience itself — it's in how it's presented. One better-phrased sentence can turn a routine task into a standout achievement. One keyword added in the right place can be the difference between your resume being read or tossed into the digital trash.",
    bridge: "Don't let your experience go to waste inside a weak resume",
  },
  bullets: {
    title: "What exactly do we improve?",
    sub: "Our AI doesn't just rewrite your resume — it rebuilds its impact:",
    items: [
      "Reframes tasks and responsibilities to highlight impact and achievement instead of mere description",
      "Adds the right keywords for your field and target role",
      "Strengthens your professional summary to convince in the first few seconds",
      "Organizes content in a way that's easy for recruiters to scan quickly",
    ],
  },
  why: {
    title: "Make every line work for you",
    p1: "JobAI24's AI doesn't add empty filler — it analyzes your current resume, compares it against job requirements, and rewrites every section to convince both ATS filters and the recruiter simultaneously.",
    p2: "The result isn't a new resume — it's you at your best professional presentation.",
  },
  why2: {
    title: "Because employers don't have time",
    p1: "On average, a recruiter spends just 7 seconds looking at a resume for the first time.",
    p2: "In those 7 seconds, three questions happen almost instantly: Is this person qualified? Does their resume show clear achievements? Is it worth reading more?",
    p3: "Your JobAI24-enhanced resume is designed to answer all three questions with \"yes\" in the first seconds.",
  },
  outcome: {
    title: "The difference you'll feel",
    nots: [
      "Not a literal translation of what you wrote",
      "Not adding hollow buzzwords",
      "Not a generic resume that works for every job",
    ],
    goal: "An enhanced version of you — persuasive, targeted, and interview-ready",
    cta: "Get a Stronger Resume Today",
    trust: ["Free to start", "Instant results", "No credit card"],
  },
};

export default async function ResumeEnhancementPage() {
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
          <p className={`text-2xl font-black leading-tight text-slate-950 md:text-3xl ${isAr ? "text-right" : "text-left"}`}>
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

      {/* ── What we improve ── */}
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

      {/* ── Every line works ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`text-3xl font-black tracking-tight text-slate-950 md:text-4xl ${isAr ? "text-right" : "text-left"}`}>
            {t.why.title}
          </h2>
          <div className={`mt-8 space-y-5 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-lg leading-relaxed text-slate-600">{t.why.p1}</p>
            <p className="text-lg font-semibold leading-relaxed text-slate-800">
              {t.why.p2}
            </p>
          </div>
        </div>
      </section>

      {/* ── Employers don't have time ── */}
      <section className="bg-brand-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`text-3xl font-black tracking-tight text-white md:text-4xl ${isAr ? "text-right" : "text-left"}`}>
            {t.why2.title}
          </h2>
          <div className={`mt-8 space-y-5 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-lg leading-relaxed text-brand-100">{t.why2.p1}</p>
            <p className="text-lg leading-relaxed text-brand-100">{t.why2.p2}</p>
            <p className="text-lg font-semibold leading-relaxed text-white">
              {t.why2.p3}
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
