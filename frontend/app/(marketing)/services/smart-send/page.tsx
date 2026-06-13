import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  Send,
  CheckCircle2,
  UserCheck,
  MailCheck,
  Eye,
  Shield,
  Zap,
  TrendingUp,
  Users,
  GraduationCap,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Clock,
  Target,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "التسويق الذكي للسيرة الذاتية — JobAI24"
      : "Smart CV Marketing — JobAI24",
    description: isAr
      ? "لا تنتظر أن يجدك أصحاب العمل. وصّل سيرتك الذاتية مباشرة لمسؤولي التوظيف في شركات موافقة على الاستقبال — برسائل مخصصة وشخصية لكل شركة."
      : "Stop waiting for employers to find you. Deliver your CV directly to hiring managers at opted-in companies — with a personalized message written for each one.",
  };
}

const AR = {
  hero: {
    badge: "التسويق الذكي للسيرة الذاتية",
    h1: "لا تنتظر — وصّل سيرتك لمديري التوظيف مباشرة",
    sub: "معظم المتقدمين يرسلون طلباتهم ثم ينتظرون ولا يسمعون شيئاً. JobAI24 يُغيّر المعادلة — يُرسل سيرتك مباشرة لشركات تبحث عن مرشحين مثلك، برسالة مخصصة لكل جهة.",
    cta: "أطلق حملتي الآن",
    trust: ["شركات موافقة على الاستقبال فقط", "رسالة مخصصة لكل شركة", "أنت تعاين قبل الإرسال"],
  },
  what: {
    title: "ما هذه الخدمة؟",
    paras: [
      "التسويق الذكي للسيرة الذاتية هو حملة تواصل مهني نشط — بدلاً من انتظار إعلانات الوظائف، ترسل سيرتك مباشرة لشركات سجّلت معنا وأبدت رغبتها في استقبال ملفات المرشحين المناسبين.",
      "لكل شركة في قائمتك، يكتب الذكاء الاصطناعي رسالة تواصل مخصصة باسم الشركة ومجالها واحتياجها — وليست رسالة جماعية واحدة تُرسل للجميع. أنت تُراجع الرسائل وقائمة الشركات وتوافق عليها قبل أي إرسال.",
      "هذا ليس بريداً مزعجاً. هذا تواصل احترافي مستهدف يُشبه ما يفعله المحترفون يدوياً — ولكن بسرعة وكفاءة لا يمكن تحقيقها بدون مساعدة ذكاء اصطناعي.",
    ],
  },
  benefits: {
    title: "ماذا ستحصل؟",
    cards: [
      {
        icon: "userCheck",
        title: "قائمة شركات موافقة على الاستقبال",
        desc: "نصل فقط لشركات سجّلت لدينا ووافقت على استقبال ملفات المرشحين.",
      },
      {
        icon: "mailCheck",
        title: "رسالة مخصصة لكل شركة",
        desc: "كل رسالة تُكتب بالذكاء الاصطناعي خصيصاً لاسم الشركة ومجالها — لا نسخ جماعي.",
      },
      {
        icon: "eye",
        title: "معاينة كاملة قبل الإرسال",
        desc: "تشوف كل رسالة وكل شركة في القائمة — ولا يُرسل شيء قبل موافقتك.",
      },
      {
        icon: "target",
        title: "استثناء أي شركة تريدها",
        desc: "احذف جهة عملك الحالية أو أي شركة لا تريد الوصول إليها.",
      },
      {
        icon: "zap",
        title: "تتبع حالة الإرسال",
        desc: "تعرف أي رسالة أُرسلت بنجاح وأيها احتاجت إعادة محاولة.",
      },
      {
        icon: "shield",
        title: "امتثال كامل لحماية البيانات",
        desc: "الحملة تسير وفق نظام PDPL السعودي — بياناتك وبيانات جهات التواصل محمية.",
      },
    ],
  },
  howItWorks: {
    title: "كيف يعمل؟",
    steps: [
      {
        n: "١",
        title: "أدخل بياناتك والوظيفة المستهدفة",
        desc: "حدد مجالك والمسمى الوظيفي والموقع الجغرافي — النظام يُطابق الشركات المناسبة.",
      },
      {
        n: "٢",
        title: "راجع القائمة والرسائل ووافق عليها",
        desc: "شاهد كل شركة مستهدفة ورسالتها المخصصة — اعدّل أو احذف ما لا يناسبك.",
      },
      {
        n: "٣",
        title: "أطلق الحملة وتابع النتائج",
        desc: "الحملة تنطلق تلقائياً بمعدل إرسال طبيعي — تتابع التقدم من لوحة التحكم.",
      },
    ],
  },
  results: {
    title: "ما الذي يمكن أن تتوقعه؟",
    items: [
      "الوصول لفرص وظيفية لم تُعلن على الإنترنت بعد",
      "تواصل مهني نشط بدلاً من الانتظار السلبي",
      "ظهور مباشر أمام مسؤولي توظيف يبحثون عن مرشحين",
      "رسائل تبدو احترافية وشخصية لا آلية",
      "توفير أسابيع من التواصل اليدوي في أيام",
    ],
  },
  audience: {
    title: "من يستفيد من هذه الخدمة؟",
    cards: [
      {
        icon: "graduationCap",
        title: "الخريجون الجدد",
        desc: "لا خبرة كافية تجعلك مرئياً؟ ابدأ بالوصول للشركات مباشرة.",
      },
      {
        icon: "briefcase",
        title: "الباحثون عن فرص غير معلنة",
        desc: "كثير من الوظائف تُملأ قبل الإعلان — هذه الخدمة تضعك هناك مبكراً.",
      },
      {
        icon: "users",
        title: "من لا يحصل على ردود من التقديم العادي",
        desc: "إذا أرسلت عشرات الطلبات ولم تتلق ردوداً — غيّر الاستراتيجية.",
      },
    ],
  },
  why: {
    title: "لماذا JobAI24؟",
    items: [
      "شركات موافقة حقيقية — لا إرسال لعناوين عشوائية",
      "رسائل مخصصة يكتبها ذكاء اصطناعي — لا نسخ جماعي",
      "أنت تتحكم في كل شيء قبل الإرسال",
      "امتثال كامل لنظام حماية البيانات السعودي PDPL",
      "تتبع كامل لحالة كل رسالة",
      "يمكن تكرار الحملة أو تعديلها في أي وقت",
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "هل سيبدو كأنه بريد مزعج؟",
        a: "لا. الرسائل فردية ومخصصة وتُرسل لشركات اختارت استقبال ملفات المرشحين — وبمعدل إرسال طبيعي يُحاكي التواصل البشري.",
      },
      {
        q: "هل يمكنني استثناء شركات معينة؟",
        a: "نعم. قبل إطلاق الحملة تراجع القائمة الكاملة وتحذف أي جهة لا تريد الوصول إليها.",
      },
      {
        q: "هل أستطيع رؤية الرسائل قبل إرسالها؟",
        a: "نعم. تشاهد كل رسالة لكل شركة قبل الإرسال — ولا يُرسل شيء باسمك دون علمك.",
      },
      {
        q: "ما عدد الشركات في الحملة الواحدة؟",
        a: "يعتمد على باقتك ومجالك — يمكنك الاطلاع على الأرقام الدقيقة في صفحة الأسعار.",
      },
      {
        q: "ماذا لو أردت إيقاف الحملة؟",
        a: "يمكنك إيقاف أي حملة نشطة في أي وقت من لوحة التحكم.",
      },
      {
        q: "هل ستعرف الشركة أنني استخدمت ذكاءً اصطناعياً؟",
        a: "لا. الرسائل تبدو احترافية وشخصية — لا يوجد ما يُشير إلى استخدام الذكاء الاصطناعي.",
      },
      {
        q: "هل بيانات الشركات في القائمة سرية؟",
        a: "بيانات جهات التواصل تُستخدم فقط لأغراض الحملة وتُعالج وفق نظام PDPL.",
      },
      {
        q: "ما الفرق بين هذه الخدمة والتقديم العادي على الوظائف؟",
        a: "التقديم العادي يعني المنافسة مع مئات المتقدمين على وظيفة معلنة. هذه الخدمة تُوصلك مباشرة لمسؤول التوظيف قبل أن تُعلن الوظيفة أصلاً.",
      },
    ],
  },
  finalCta: {
    h2: "جاهز للتوقف عن الانتظار؟",
    sub: "أطلق حملتك الآن وابدأ بالوصول المباشر لمسؤولي التوظيف.",
    cta: "أطلق حملتي الآن",
    note: "بدون بطاقة ائتمانية — أنت تتحكم في كل شيء",
  },
};

const EN = {
  hero: {
    badge: "Smart CV Marketing",
    h1: "Stop Waiting. Get Your CV in Front of Hiring Managers Directly",
    sub: "Most applicants submit and hear nothing back. JobAI24 changes that equation — sending your CV directly to companies actively looking for candidates like you, with a personalized message written for each one.",
    cta: "Launch My Campaign Now",
    trust: ["Opted-in companies only", "Personalized message per company", "You preview before anything sends"],
  },
  what: {
    title: "What is this service?",
    paras: [
      "Smart CV Marketing is an active professional outreach campaign — instead of waiting for job postings, your CV is sent directly to companies that have registered with us and expressed interest in receiving matched candidate profiles.",
      "For each company on your list, the AI writes a personalized outreach message using that company's name, industry, and needs — not a mass template sent to everyone. You review all messages and the company list before anything is sent.",
      "This is not spam. This is targeted professional outreach that mirrors what top professionals do manually — but at a speed and scale that's impossible without AI assistance.",
    ],
  },
  benefits: {
    title: "What will I get?",
    cards: [
      {
        icon: "userCheck",
        title: "Opted-In Company List",
        desc: "We only reach companies that registered with us and agreed to receive candidate profiles.",
      },
      {
        icon: "mailCheck",
        title: "Personalized Message Per Company",
        desc: "Every message is AI-written for that company's name and industry — no mass copying.",
      },
      {
        icon: "eye",
        title: "Full Preview Before Sending",
        desc: "You see every message and every company on the list — nothing sends without your approval.",
      },
      {
        icon: "target",
        title: "Exclude Any Company You Want",
        desc: "Remove your current employer or any company you don't want to contact.",
      },
      {
        icon: "zap",
        title: "Send Status Tracking",
        desc: "Know which messages were successfully sent and which need a retry.",
      },
      {
        icon: "shield",
        title: "Full Data Protection Compliance",
        desc: "The campaign runs in line with Saudi PDPL — your data and contact data are protected.",
      },
    ],
  },
  howItWorks: {
    title: "How does it work?",
    steps: [
      {
        n: "1",
        title: "Enter Your Profile and Target Role",
        desc: "Specify your field, job title, and location — the system matches relevant companies.",
      },
      {
        n: "2",
        title: "Review the List and Messages",
        desc: "See every target company and its personalized message — edit or remove anything that doesn't fit.",
      },
      {
        n: "3",
        title: "Launch and Track",
        desc: "The campaign runs automatically at a natural sending pace — track progress from your dashboard.",
      },
    ],
  },
  results: {
    title: "What results can you expect?",
    items: [
      "Access to job opportunities that haven't been posted online yet",
      "Active professional outreach instead of passive waiting",
      "Direct visibility with hiring managers who are looking for candidates",
      "Messages that feel professional and personal — not automated",
      "Save weeks of manual networking in just a few days",
    ],
  },
  audience: {
    title: "Who is this for?",
    cards: [
      {
        icon: "graduationCap",
        title: "Recent Graduates",
        desc: "Not enough experience to stand out? Start by reaching companies directly.",
      },
      {
        icon: "briefcase",
        title: "Seekers of Unadvertised Roles",
        desc: "Many jobs are filled before they're ever posted — this service puts you there early.",
      },
      {
        icon: "users",
        title: "Applicants Getting No Responses",
        desc: "If you've sent dozens of applications with no replies — it's time to change strategy.",
      },
    ],
  },
  why: {
    title: "Why JobAI24?",
    items: [
      "Real opted-in companies — no sending to random email addresses",
      "Personalized messages written by AI — not mass copying",
      "You control everything before any message is sent",
      "Full compliance with Saudi PDPL data protection law",
      "Complete tracking of every message status",
      "Campaigns can be paused, resumed, or modified at any time",
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "Will it look like spam?",
        a: "No. Messages are individual, personalized, and sent to companies that chose to receive candidate profiles — at a natural pace that mirrors professional human outreach.",
      },
      {
        q: "Can I exclude specific companies?",
        a: "Yes. Before launching, you review the full list and remove any company you don't want to contact.",
      },
      {
        q: "Can I see the messages before they're sent?",
        a: "Yes. You review every message for every company before sending — nothing goes out in your name without your knowledge.",
      },
      {
        q: "How many companies are in one campaign?",
        a: "It depends on your plan and field — see exact numbers on the pricing page.",
      },
      {
        q: "Can I stop a campaign?",
        a: "Yes. You can pause any active campaign at any time from your dashboard.",
      },
      {
        q: "Will the company know I used AI?",
        a: "No. The messages look professional and personal — there's no indication of AI involvement.",
      },
      {
        q: "Is the company contact data confidential?",
        a: "Contact data is used only for the campaign and processed in line with PDPL.",
      },
      {
        q: "What's the difference between this and regular job applications?",
        a: "Regular applications mean competing with hundreds of applicants for a posted role. This service gets you directly in front of a hiring manager before the job is even posted.",
      },
    ],
  },
  finalCta: {
    h2: "Ready to stop waiting?",
    sub: "Launch your campaign now and start reaching hiring managers directly.",
    cta: "Launch My Campaign Now",
    note: "No credit card required — you control everything",
  },
};

const BENEFIT_ICONS = {
  userCheck: UserCheck,
  mailCheck: MailCheck,
  eye: Eye,
  target: Target,
  zap: Zap,
  shield: Shield,
  trendingUp: TrendingUp,
  clock: Clock,
} as const;

const AUDIENCE_ICONS = {
  graduationCap: GraduationCap,
  briefcase: Briefcase,
  users: Users,
} as const;

export default async function SmartSendPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* 1. HERO */}
      <section className="bg-slate-950 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionBadge className="border-teal/30 bg-teal/10 text-teal">
            {t.hero.badge}
          </SectionBadge>
          <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
            {t.hero.h1}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-400">{t.hero.sub}</p>
          <Link
            href="/dashboard/smart-send"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
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
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal ${isAr ? "mr-auto" : ""}`}
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal text-sm font-black text-white">
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
      <section className="bg-teal py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <h2
            className={`mb-8 text-2xl font-black tracking-tight text-white md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.results.title}
          </h2>
          <ul className={`space-y-3 ${isAr ? "text-right" : ""}`}>
            {t.results.items.map((item) => (
              <li key={item} className={`flex items-start gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white/70" />
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
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal" />
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
            href="/dashboard/smart-send"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
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
