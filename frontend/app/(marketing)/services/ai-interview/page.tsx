import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  MessageSquare,
  CheckCircle2,
  Brain,
  Star,
  BarChart3,
  Clock,
  Target,
  Shield,
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Award,
  Mic,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "تحضير المقابلات بالذكاء الاصطناعي — JobAI24"
      : "AI Interview Preparation — JobAI24",
    description: isAr
      ? "تدرّب على أسئلة مقابلات مخصصة لوظيفتك وخبرتك. تقييم فوري لإجاباتك ونقاط قوة وضعف محددة — ادخل مقابلتك بثقة حقيقية."
      : "Practice interview questions tailored to your exact job and experience level. Get instant AI scoring on your answers — walk into your interview with real confidence.",
  };
}

const AR = {
  hero: {
    badge: "تحضير المقابلات · ذكاء اصطناعي",
    h1: "استعد لمقابلتك بأسئلة مخصصة لوظيفتك تماماً",
    sub: "معظم المرشحين يفشلون في المقابلات لأنهم تدربوا على أسئلة عامة لا علاقة لها بالوظيفة الفعلية. JobAI24 يُنشئ أسئلة مُصممة خصيصاً لمسماك الوظيفي وخبرتك — ويُقيّم إجاباتك على الفور.",
    cta: "ابدأ مقابلة تدريبية الآن",
    trust: ["بدون بطاقة ائتمانية", "أسئلة مخصصة لوظيفتك", "تقييم فوري لكل إجابة"],
  },
  what: {
    title: "ما هذه الخدمة؟",
    paras: [
      "مقابلات الذكاء الاصطناعي هي جلسات تدريبية تحاكي المقابلة الحقيقية. تُحدد الوظيفة التي تتقدم إليها ومستوى خبرتك ونوع المقابلة — ويُنشئ النظام أسئلة مُخصصة بناءً على هذه المعطيات.",
      "بعد كل إجابة، يُقيّم الذكاء الاصطناعي أداءك فوراً: يُعطيك درجة، يُحدد نقاط القوة، ويكشف ما يجب تحسينه. في النهاية تحصل على تقرير شامل بأدائك الكلي.",
      "سواء كانت مقابلة موارد بشرية أو تقنية أو مختلطة — الخدمة تُغطي الأنواع الثلاثة بأسئلة واقعية تُشبه ما ستواجهه فعلاً.",
    ],
  },
  benefits: {
    title: "ماذا ستحصل؟",
    cards: [
      {
        icon: "brain",
        title: "أسئلة مخصصة لوظيفتك",
        desc: "ليست أسئلة عامة — مبنية على مسماك الوظيفي وخبرتك ومجالك.",
      },
      {
        icon: "star",
        title: "تقييم فوري لكل إجابة",
        desc: "درجة واضحة لكل رد مع شرح ما أجدته وما يحتاج تطويراً.",
      },
      {
        icon: "barChart",
        title: "تقرير أداء كامل",
        desc: "ملخص شامل في نهاية الجلسة يكشف نقاط قوتك وأولويات التحسين.",
      },
      {
        icon: "mic",
        title: "ثلاثة أنواع مقابلات",
        desc: "اختر: موارد بشرية، تقنية، أو مختلطة — حسب ما ينتظرك فعلاً.",
      },
      {
        icon: "target",
        title: "رسالة سياق قبل البدء",
        desc: "افهم المقابلة وتوقعات الشركة قبل أول سؤال.",
      },
      {
        icon: "award",
        title: "توصية توظيف في النهاية",
        desc: "تقييم إجمالي يُخبرك بمدى جاهزيتك لهذه الوظيفة تحديداً.",
      },
    ],
  },
  howItWorks: {
    title: "كيف يعمل؟",
    steps: [
      {
        n: "١",
        title: "حدّد وظيفتك ومستوى خبرتك",
        desc: "أدخل مسمى الوظيفة وعدد سنوات خبرتك ونوع المقابلة المطلوبة.",
      },
      {
        n: "٢",
        title: "أجب على الأسئلة المُخصصة",
        desc: "النظام يطرح أسئلة واحدة تلو الأخرى — أجب بنفس الطريقة التي ستُجيب في المقابلة الحقيقية.",
      },
      {
        n: "٣",
        title: "استلم تقييمك الشامل",
        desc: "تقرير كامل بأدائك، أبرز نقاط قوتك، والمجالات التي تحتاج تحسيناً.",
      },
    ],
  },
  results: {
    title: "ما الذي يمكن أن تتوقعه؟",
    items: [
      "ثقة أكبر عند دخول المقابلة الحقيقية",
      "معرفة مسبقة بالأسئلة الشائعة في مجالك",
      "تحديد نقاط الضعف في إجاباتك قبل فوات الأوان",
      "تحسين أسلوب التعبير والوضوح في تقديم أفكارك",
      "فهم أعمق لما يبحث عنه أصحاب العمل في منصبك المستهدف",
    ],
  },
  audience: {
    title: "من يستفيد من هذه الخدمة؟",
    cards: [
      {
        icon: "graduationCap",
        title: "الخريجون المتقدمون لأول وظيفة",
        desc: "لا تدخل مقابلتك الأولى دون تحضير — التدرب يُفرق فعلاً.",
      },
      {
        icon: "briefcase",
        title: "المحترفون الباحثون عن انتقال",
        desc: "حتى لو لديك خبرة، التحضير لوظيفة جديدة يختلف عن الحالية.",
      },
      {
        icon: "users",
        title: "من يعاني من توتر المقابلات",
        desc: "التدريب الموجّه يُقلل القلق ويبني الثقة قبل اليوم الحقيقي.",
      },
    ],
  },
  why: {
    title: "لماذا JobAI24؟",
    items: [
      "أسئلة مُخصصة بناءً على مسماك الوظيفي وخبرتك — لا أسئلة جاهزة عامة",
      "تقييم فوري بعد كل إجابة — لا انتظار لتقرير في النهاية فقط",
      "يدعم اللغتين العربية والإنجليزية في نفس الجلسة",
      "أنواع مقابلات متعددة: HR، تقنية، ومختلطة",
      "مبني على خبرة سوق العمل السعودي والخليجي",
      "يمكن إعادة الجلسة أكثر من مرة لنفس الوظيفة لتحسين الأداء",
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "هل الأسئلة مختلفة في كل جلسة؟",
        a: "نعم. يُنشئ الذكاء الاصطناعي أسئلة جديدة في كل جلسة استناداً لنفس المعطيات.",
      },
      {
        q: "هل يمكنني الإجابة بالعربية؟",
        a: "نعم. الخدمة تدعم الإجابة باللغة العربية أو الإنجليزية.",
      },
      {
        q: "كم عدد الأسئلة في كل جلسة؟",
        a: "يمكنك تخصيص عدد الأسئلة حسب وقتك — من ٥ إلى ١٥ سؤالاً.",
      },
      {
        q: "هل يحفظ النظام جلساتي السابقة؟",
        a: "نعم. يمكنك مراجعة جلساتك السابقة ومقارنة تطورك بمرور الوقت.",
      },
      {
        q: "هل التقييم دقيق؟",
        a: "التقييم يعكس معايير المقابلات المعتادة في سوق العمل، لكنه لا يُعوض رأي المقابل البشري الفعلي.",
      },
      {
        q: "هل يمكنني التدرب لأكثر من وظيفة؟",
        a: "نعم. يمكنك إنشاء جلسات منفصلة لكل وظيفة تتقدم إليها.",
      },
      {
        q: "ما الفرق بين المقابلة التقنية وموارد البشر؟",
        a: "مقابلة HR تُركز على الشخصية والتوافق الثقافي. المقابلة التقنية تُركز على المهارات التخصصية في مجالك.",
      },
      {
        q: "ماذا أفعل بعد الجلسة؟",
        a: "راجع التقرير، طبّق التوصيات، ثم أعد الجلسة مرة أخرى لتقيس التحسّن.",
      },
    ],
  },
  finalCta: {
    h2: "لا تدخل مقابلتك غير مستعد",
    sub: "ابدأ جلسة تدريبية الآن وادخل مقابلتك بثقة حقيقية.",
    cta: "ابدأ مقابلة تدريبية",
    note: "بدون بطاقة ائتمانية",
  },
};

const EN = {
  hero: {
    badge: "AI Interview Preparation",
    h1: "Practice the Exact Questions You'll Face in Your Interview",
    sub: "Most candidates fail interviews because they practiced generic questions unrelated to the actual job. JobAI24 creates questions tailored specifically to your job title and experience — and scores your answers instantly.",
    cta: "Start a Practice Interview Now",
    trust: ["No credit card required", "Questions tailored to your role", "Instant scoring per answer"],
  },
  what: {
    title: "What is this service?",
    paras: [
      "AI Interviews are practice sessions that simulate a real interview. You specify the job you're applying for, your experience level, and the interview type — and the system creates customized questions based on those inputs.",
      "After each answer, the AI evaluates your performance immediately: it gives you a score, identifies strengths, and reveals what needs improvement. At the end you receive a comprehensive performance report.",
      "Whether it's an HR interview, a technical interview, or a mixed format — the service covers all three types with realistic questions that closely match what you'll actually face.",
    ],
  },
  benefits: {
    title: "What will I get?",
    cards: [
      {
        icon: "brain",
        title: "Questions Tailored to Your Role",
        desc: "Not generic questions — built on your job title, experience level, and industry.",
      },
      {
        icon: "star",
        title: "Instant Scoring Per Answer",
        desc: "A clear score for every response with an explanation of what worked and what didn't.",
      },
      {
        icon: "barChart",
        title: "Full Performance Report",
        desc: "A comprehensive end-of-session summary revealing your strengths and top improvement areas.",
      },
      {
        icon: "mic",
        title: "Three Interview Types",
        desc: "Choose: HR, technical, or mixed — based on what's actually waiting for you.",
      },
      {
        icon: "target",
        title: "Context Message Before You Start",
        desc: "Understand the interview setup and company expectations before the first question.",
      },
      {
        icon: "award",
        title: "Hiring Recommendation at the End",
        desc: "An overall assessment that tells you how ready you are for this specific role.",
      },
    ],
  },
  howItWorks: {
    title: "How does it work?",
    steps: [
      {
        n: "1",
        title: "Set Your Role and Experience",
        desc: "Enter the job title, years of experience, and type of interview you need to prepare for.",
      },
      {
        n: "2",
        title: "Answer the Tailored Questions",
        desc: "The system asks questions one by one — answer the way you would in a real interview.",
      },
      {
        n: "3",
        title: "Receive Your Full Assessment",
        desc: "A complete report on your performance, key strengths, and areas to improve.",
      },
    ],
  },
  results: {
    title: "What results can you expect?",
    items: [
      "More confidence walking into the real interview",
      "Advance knowledge of common questions in your field",
      "Identify weak points in your answers before it matters",
      "Improve how clearly and confidently you express your thoughts",
      "Deeper understanding of what employers look for in your target role",
    ],
  },
  audience: {
    title: "Who is this for?",
    cards: [
      {
        icon: "graduationCap",
        title: "Graduates Applying for Their First Job",
        desc: "Don't walk into your first interview unprepared — practice makes a real difference.",
      },
      {
        icon: "briefcase",
        title: "Professionals Making a Career Move",
        desc: "Even with experience, preparing for a new role is different from your current one.",
      },
      {
        icon: "users",
        title: "Anyone Who Gets Nervous in Interviews",
        desc: "Targeted practice reduces anxiety and builds genuine confidence before the real day.",
      },
    ],
  },
  why: {
    title: "Why JobAI24?",
    items: [
      "Questions customized to your job title and experience — no generic question banks",
      "Instant evaluation after every answer — not just a report at the end",
      "Supports both Arabic and English in the same session",
      "Multiple interview types: HR, technical, and mixed",
      "Built on Saudi and GCC job market experience",
      "Repeat sessions as many times as you like to measure your improvement",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "Are the questions different in each session?",
        a: "Yes. The AI generates new questions every session based on the same inputs.",
      },
      {
        q: "Can I answer in Arabic?",
        a: "Yes. The service supports answers in both Arabic and English.",
      },
      {
        q: "How many questions are in each session?",
        a: "You can customize the number based on your time — from 5 to 15 questions.",
      },
      {
        q: "Does the system save my past sessions?",
        a: "Yes. You can review previous sessions and track your improvement over time.",
      },
      {
        q: "How accurate is the evaluation?",
        a: "The evaluation reflects standard interview criteria in the job market, but it doesn't replace the judgment of a real human interviewer.",
      },
      {
        q: "Can I practice for more than one job?",
        a: "Yes. You can create separate sessions for each role you're applying to.",
      },
      {
        q: "What's the difference between a technical and HR interview?",
        a: "HR interviews focus on personality and cultural fit. Technical interviews focus on specialized skills in your field.",
      },
      {
        q: "What should I do after a session?",
        a: "Review the report, apply the recommendations, then repeat the session to measure improvement.",
      },
    ],
  },
  finalCta: {
    h2: "Don't walk into your interview unprepared",
    sub: "Start a practice session now and walk into your real interview with genuine confidence.",
    cta: "Start a Practice Interview",
    note: "No credit card required",
  },
};

const BENEFIT_ICONS = {
  brain: Brain,
  star: Star,
  barChart: BarChart3,
  mic: Mic,
  target: Target,
  award: Award,
} as const;

const AUDIENCE_ICONS = {
  graduationCap: GraduationCap,
  briefcase: Briefcase,
  users: Users,
} as const;

export default async function AiInterviewPage() {
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
            href="/register"
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
            href="/register"
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
