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
      ? "التدريب على المقابلات — JobAI24"
      : "AI Interview Training — JobAI24",
    description: isAr
      ? "تدرّب على مقابلاتك الوظيفية قبل اليوم الحقيقي. محاكاة واقعية بالذكاء الاصطناعي مخصصة لوظيفتك ومجالك مع تقييم فوري."
      : "Practice your job interviews before the real day. Realistic AI simulations tailored to your role and field with instant scoring.",
  };
}

const AR = {
  hero: {
    badge: "التدريب على المقابلات",
    h1: "تدرّب على الوظيفة",
    h1Highlight: "قبل أن تجلس أمام مسؤول التوظيف",
    sub: "لأن الفرصة تُمنح لمن استعدّ — لا لمن يمتلك الخبرة فقط.",
    cta: "ابدأ التدريب مجاناً",
  },
  narrative: {
    p1: "أكثر ما يضيّع الفرص الوظيفية ليس نقص الخبرة. بل ضعف الاستعداد.",
    p2: "كثير من الباحثين عن عمل يدخلون المقابلة وهم يعتقدون أن خبرتهم تتحدث عن نفسها. لكن المقابلة ليست اختباراً للخبرة فقط — إنها اختبار لقدرتك على التواصل وتقديم نفسك بوضوح تحت ضغط الموقف الحقيقي.",
    bridge: "الاستعداد يتفوق على الخبرة",
  },
  sim: {
    title: "استعدّ للمقابلة وكأنها حدثت مسبقاً",
    sub: "JobAI24 يُحاكي مقابلة حقيقية مصممة خصيصاً لك:",
    items: [
      "أسئلة مخصصة للوظيفة التي تتقدم إليها وليس أسئلة عامة",
      "محاكاة لأنماط مختلفة من المقابلات: سلوكية، تقنية، وضغط",
      "تقييم فوري لكل إجابة مع اقتراحات تحسين محددة",
      "تكرار التدريب حتى تصل إلى مستوى الثقة الذي تريده",
    ],
  },
  weaknesses: {
    title: "تعرّف على نقاط ضعفك قبل أن يكتشفها مسؤول التوظيف",
    p1: "الأسئلة الصعبة لا تُفاجئك في التدريب — وإذا فاجأتك، فأنت في بيئة آمنة للتعلم والتحسين.",
    items: [
      "إجاباتك التي تبدو مترددة أو غير واضحة",
      "الأسئلة التي تستغرق وقتاً طويلاً أو تفتقر لأمثلة ملموسة",
      "نقاط ضعف في تقديم إنجازاتك بطريقة مقنعة",
      "الفجوات في معرفتك بالشركة أو المنصب",
    ],
  },
  confidence: {
    title: "ادخل المقابلة بثقة أكبر",
    p1: "الفارق بين مرشح متوتر ومرشح واثق في المقابلة لا يُقاس بالخبرة — بل بعدد مرات التدريب.",
    p2: "حين تكون قد أجبت على الأسئلة الصعبة عشرات المرات في بيئة تدريبية، لا يبدو السؤال الحقيقي مخيفاً — بل مألوفاً.",
  },
  outcome: {
    title: "ما الذي يتغير بعد التدريب؟",
    nots: [
      "لا مزيد من الأجوبة المتعثرة التي تندم عليها بعد المقابلة",
      "لا مزيد من الخروج وأنت تتمنى لو قلت شيئاً آخر",
      "لا مزيد من المفاجآت غير المتوقعة",
    ],
    goal: "ثقة حقيقية مبنية على استعداد حقيقي",
    cta: "ابدأ التدريب على المقابلات الآن",
    trust: ["مجاني للبدء", "مخصص لوظيفتك", "لا بطاقة ائتمانية"],
  },
};

const EN = {
  hero: {
    badge: "AI Interview Training",
    h1: "Practice the job",
    h1Highlight: "before you sit in front of the interviewer",
    sub: "Because opportunities go to the prepared — not just the experienced.",
    cta: "Start Training Free",
  },
  narrative: {
    p1: "What loses job opportunities most isn't lack of experience. It's poor preparation.",
    p2: "Many job seekers walk into an interview thinking their experience speaks for itself. But an interview isn't just a test of experience — it's a test of your ability to communicate and present yourself clearly under the pressure of the real moment.",
    bridge: "Preparation beats experience",
  },
  sim: {
    title: "Prepare as if the interview already happened",
    sub: "JobAI24 simulates a real interview designed specifically for you:",
    items: [
      "Questions tailored to the specific role you're applying for — not generic questions",
      "Simulation of different interview styles: behavioral, technical, and pressure-based",
      "Instant evaluation of each answer with specific improvement suggestions",
      "Repeat practice until you reach the confidence level you want",
    ],
  },
  weaknesses: {
    title: "Know your weaknesses before the interviewer does",
    p1: "Tough questions don't surprise you in training — and if they do, you're in a safe environment to learn and improve.",
    items: [
      "Answers that sound hesitant or unclear",
      "Questions that take too long or lack concrete examples",
      "Weaknesses in presenting your achievements persuasively",
      "Gaps in your knowledge about the company or the position",
    ],
  },
  confidence: {
    title: "Enter the interview with more confidence",
    p1: "The difference between a nervous candidate and a confident one in an interview isn't measured by experience — it's measured by the number of practice sessions.",
    p2: "When you've answered tough questions dozens of times in a training environment, the real question doesn't feel scary — it feels familiar.",
  },
  outcome: {
    title: "What changes after training?",
    nots: [
      "No more stumbling answers you regret after the interview",
      "No more walking out wishing you'd said something different",
      "No more unexpected surprises",
    ],
    goal: "Real confidence built on real preparation",
    cta: "Start Interview Training Now",
    trust: ["Free to start", "Tailored to your role", "No credit card"],
  },
};

export default async function AiInterviewPage() {
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

      {/* ── Simulate the interview ── */}
      <section className="bg-slate-50 py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className={isAr ? "text-right" : "text-left"}>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.sim.title}
            </h2>
            <p className="mt-3 text-lg text-slate-500">{t.sim.sub}</p>
            <ul className="mt-10 space-y-4">
              {t.sim.items.map((item, i) => (
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

      {/* ── Know your weaknesses ── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className={isAr ? "text-right" : "text-left"}>
            <h2 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.weaknesses.title}
            </h2>
            <p className={`mt-4 text-lg leading-relaxed text-slate-600 ${isAr ? "text-right" : "text-left"}`}>
              {t.weaknesses.p1}
            </p>
            <ul className="mt-8 space-y-4">
              {t.weaknesses.items.map((item, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}
                >
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">
                    !
                  </span>
                  <span className="text-base leading-relaxed text-slate-700 md:text-lg">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Enter with confidence ── */}
      <section className="bg-brand-700 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className={`text-3xl font-black tracking-tight text-white md:text-4xl ${isAr ? "text-right" : "text-left"}`}>
            {t.confidence.title}
          </h2>
          <div className={`mt-8 space-y-5 ${isAr ? "text-right" : "text-left"}`}>
            <p className="text-lg leading-relaxed text-brand-100">{t.confidence.p1}</p>
            <p className="text-lg font-semibold leading-relaxed text-white">
              {t.confidence.p2}
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
