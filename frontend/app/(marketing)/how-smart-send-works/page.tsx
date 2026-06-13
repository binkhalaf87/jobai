import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import {
  ShieldCheck,
  Eye,
  UserCheck,
  MailCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Zap,
  Target,
} from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr
      ? "كيف يعمل التسويق الذكي للسيرة الذاتية — JobAI24"
      : "How Smart CV Marketing Works — JobAI24",
    description: isAr
      ? "كيف يوصل JobAI24 سيرتك لأصحاب العمل: شركات موافقة على الاستقبال، رسائل مخصصة لكل جهة، ومعاينة كاملة قبل الإرسال — شفافية تامة، امتثال لنظام PDPL."
      : "How JobAI24 delivers your CV to employers: opted-in companies only, personalized messages per recipient, full preview before anything sends — complete transparency, PDPL compliant.",
  };
}

const AR = {
  hero: {
    badge: "الشفافية أولاً",
    h1: "كيف يعمل التسويق الذكي للسيرة الذاتية؟",
    sub: "ليس بريداً جماعياً عشوائياً — بل تواصل احترافي مخصص يحترم خصوصية الجميع. إليك بالضبط كيف تصل سيرتك لأصحاب العمل المناسبين.",
    cta: "أطلق حملتي الآن",
  },
  principles: {
    title: "أربعة مبادئ لا نتنازل عنها",
    items: [
      {
        icon: "userCheck",
        title: "الشركات موافقة على الاستقبال",
        desc: "نرسل ملفك فقط لشركات وجهات توظيف سجلت لدينا أو وافقت صراحةً على استقبال ملفات المرشحين المطابقين لاحتياجها. لا نرسل لعناوين عشوائية أو مُجمَّعة.",
      },
      {
        icon: "mailCheck",
        title: "رسالة مخصصة لكل شركة",
        desc: "كل رسالة تُكتب بالذكاء الاصطناعي خصيصاً للشركة المستهدفة — باسمها ومجالها واحتياجها — وليست رسالة واحدة منسوخة لمئات الجهات. كل تواصل هو علاقة مهنية فردية.",
      },
      {
        icon: "eye",
        title: "أنت تعاين قبل الإرسال",
        desc: "تشاهد نموذج رسالة التواصل وقائمة الشركات المستهدفة وتوافق عليها قبل انطلاق الحملة. يمكنك حذف أي جهة لا تريد الوصول إليها — مثل جهة عملك الحالية. لا يُرسل شيء باسمك دون علمك.",
      },
      {
        icon: "shield",
        title: "التزام كامل بحماية البيانات",
        desc: "نعالج بياناتك وبيانات جهات التواصل وفق نظام حماية البيانات الشخصية السعودي (PDPL) — مع حقك الكامل في إيقاف الحملة أو طلب حذف بياناتك في أي وقت.",
      },
    ],
  },
  howItWorks: {
    title: "الخطوات من البداية للنهاية",
    steps: [
      {
        n: "١",
        title: "تُحدد مجالك والوظيفة المستهدفة",
        desc: "نُطابق سيرتك مع الشركات المناسبة في قاعدة بياناتنا من المؤسسات الموافقة.",
      },
      {
        n: "٢",
        title: "تراجع القائمة والرسائل",
        desc: "تشاهد كل شركة ورسالتها المخصصة — تعدّل أو تحذف ما لا يناسبك قبل الإطلاق.",
      },
      {
        n: "٣",
        title: "الحملة تنطلق بمعدل طبيعي",
        desc: "الإرسال يسير بإيقاع يُحاكي التواصل البشري الاحترافي — لا كبريد جماعي.",
      },
    ],
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      {
        q: "هل سيبدو الإرسال كأنه سبام؟",
        a: "لا. الرسائل فردية ومخصصة وتُرسل لجهات اختارت استقبال ملفات المرشحين، وبمعدل إرسال طبيعي يحاكي التواصل البشري الاحترافي.",
      },
      {
        q: "هل أستطيع استثناء شركات معينة؟",
        a: "نعم، يمكنك مراجعة قائمة الشركات المستهدفة وحذف أي جهة لا تريد الوصول إليها قبل إطلاق الحملة — مثل جهة عملك الحالية.",
      },
      {
        q: "هل ستعرف الشركة أن الرسالة كُتبت بذكاء اصطناعي؟",
        a: "لا. الرسائل تبدو احترافية وشخصية — لا يوجد ما يُشير لاستخدام الذكاء الاصطناعي.",
      },
      {
        q: "ماذا يحدث لبياناتي بعد الحملة؟",
        a: "تبقى بياناتك في حسابك تحت سيطرتك. يمكنك طلب حذفها نهائياً في أي وقت عبر إعدادات الحساب أو بمراسلتنا.",
      },
      {
        q: "هل يمكنني إيقاف الحملة بعد إطلاقها؟",
        a: "نعم. يمكن إيقاف أي حملة نشطة في أي وقت من لوحة التحكم.",
      },
      {
        q: "كم شركة تتضمن الحملة الواحدة؟",
        a: "يعتمد على باقتك ومجالك — يمكنك الاطلاع على الأرقام الدقيقة في صفحة الأسعار.",
      },
    ],
  },
  finalCta: {
    h2: "جاهز للوصول المباشر لأصحاب العمل؟",
    sub: "ابدأ حملتك وسيرتك تصل لمن يبحث عن مرشح مثلك.",
    cta: "أطلق حملتي الآن",
  },
};

const EN = {
  hero: {
    badge: "Transparency First",
    h1: "How does Smart CV Marketing work?",
    sub: "It's not random bulk email — it's personalized, professional outreach that respects everyone's privacy. Here's exactly how your CV reaches the right employers.",
    cta: "Launch My Campaign",
  },
  principles: {
    title: "Four principles we never compromise on",
    items: [
      {
        icon: "userCheck",
        title: "Companies are opted in",
        desc: "We only send your profile to companies and hiring contacts that registered with us or explicitly agreed to receive matching candidate profiles. We never send to random or scraped addresses.",
      },
      {
        icon: "mailCheck",
        title: "A personalized message per company",
        desc: "Every message is AI-written specifically for the target company — its name, industry, and needs — not one template copied to hundreds of recipients. Every outreach is an individual professional relationship.",
      },
      {
        icon: "eye",
        title: "You preview before anything sends",
        desc: "You review the outreach message and the list of target companies and approve them before the campaign launches. You can remove any company you don't want to contact — like your current employer. Nothing is sent in your name without your knowledge.",
      },
      {
        icon: "shield",
        title: "Full data protection compliance",
        desc: "We process your data and contact data in line with the Saudi Personal Data Protection Law (PDPL) — with your full right to pause the campaign or request deletion of your data at any time.",
      },
    ],
  },
  howItWorks: {
    title: "Step by step from start to finish",
    steps: [
      {
        n: "1",
        title: "You specify your field and target role",
        desc: "We match your CV with relevant companies in our database of opted-in organizations.",
      },
      {
        n: "2",
        title: "You review the list and messages",
        desc: "You see each company and its personalized message — edit or remove anything before launch.",
      },
      {
        n: "3",
        title: "The campaign runs at a natural pace",
        desc: "Sending follows a rhythm that mirrors professional human outreach — not bulk email blasting.",
      },
    ],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      {
        q: "Will it look like spam?",
        a: "No. Messages are individual, personalized, and sent to contacts who chose to receive candidate profiles, at a natural pace that mirrors professional human outreach.",
      },
      {
        q: "Can I exclude specific companies?",
        a: "Yes — you can review the target list and remove any company you don't want to reach before launching, such as your current employer.",
      },
      {
        q: "Will the company know I used AI to write the message?",
        a: "No. The messages look professional and personal — there's nothing to indicate AI involvement.",
      },
      {
        q: "What happens to my data after the campaign?",
        a: "Your data stays in your account, under your control. You can request permanent deletion at any time from account settings or by contacting us.",
      },
      {
        q: "Can I stop a campaign after it launches?",
        a: "Yes. Any active campaign can be paused at any time from your dashboard.",
      },
      {
        q: "How many companies are in one campaign?",
        a: "It depends on your plan and field — see exact numbers on the pricing page.",
      },
    ],
  },
  finalCta: {
    h2: "Ready to reach employers directly?",
    sub: "Launch your campaign and get your CV to the people looking for someone like you.",
    cta: "Launch My Campaign",
  },
};

const ICONS = {
  userCheck: UserCheck,
  mailCheck: MailCheck,
  eye: Eye,
  shield: ShieldCheck,
} as const;

export default async function HowSmartSendWorksPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      {/* HERO */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionBadge>{t.hero.badge}</SectionBadge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {t.hero.h1}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">{t.hero.sub}</p>
          <Link
            href="/dashboard/smart-send"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-teal px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
          >
            {t.hero.cta}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FOUR PRINCIPLES */}
      <section className="bg-slate-50 py-16 md:py-20" id="how-we-do-it">
        <div className="mx-auto max-w-5xl px-6">
          <h2
            className={`mb-8 text-2xl font-black tracking-tight text-slate-950 md:text-3xl ${isAr ? "text-right" : ""}`}
          >
            {t.principles.title}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {t.principles.items.map((p) => {
              const Icon = ICONS[p.icon as keyof typeof ICONS];
              return (
                <div
                  key={p.title}
                  className={`rounded-2xl border border-white bg-white p-6 shadow-sm ${isAr ? "text-right" : ""}`}
                >
                  <div
                    className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal/10 text-teal ${isAr ? "mr-auto" : ""}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1 font-bold text-slate-950">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-16 md:py-20">
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

      {/* FAQ */}
      <section className="bg-slate-50 py-16 md:py-20">
        <div className={`mx-auto max-w-3xl px-6 ${isAr ? "text-right" : ""}`}>
          <h2 className="mb-6 text-2xl font-black tracking-tight text-slate-950">{t.faq.title}</h2>
          <div className="space-y-5">
            {t.faq.items.map(({ q, a }) => (
              <div key={q} className="border-b border-slate-200 pb-5 last:border-0">
                <p className="font-bold text-slate-950">{q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-950 py-16 md:py-20">
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
          <p className="mt-3 text-xs text-slate-500">
            {isAr ? "أنت تتحكم في كل شيء قبل الإرسال" : "You control everything before anything sends"}
          </p>
        </div>
      </section>
    </div>
  );
}
