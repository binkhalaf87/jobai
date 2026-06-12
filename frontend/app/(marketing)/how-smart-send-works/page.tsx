import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { ShieldCheck, Eye, UserCheck, MailCheck } from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr ? "كيف يعمل الإرسال الذكي — JobAI24" : "How Smart Send Works — JobAI24",
    description: isAr
      ? "كيف يوصل JobAI24 سيرتك لأصحاب العمل: شركات موافقة على الاستقبال، رسائل مخصصة، ومعاينة كاملة قبل الإرسال — بالتوافق مع نظام حماية البيانات السعودي."
      : "How JobAI24 delivers your resume to employers: opted-in companies, personalized messages, full preview before sending — PDPL compliant.",
  };
}

const AR = {
  badge: "الشفافية أولاً",
  h1: "كيف يعمل التسويق الذكي للسيرة الذاتية؟",
  sub: "ليس بريداً جماعياً عشوائياً — بل تواصل احترافي مخصص يحترم خصوصية الجميع. إليك بالضبط كيف نقوم بذلك.",
  points: [
    {
      icon: "userCheck",
      title: "الشركات موافقة على الاستقبال",
      desc: "نرسل ملفك فقط لشركات وجهات توظيف سجلت لدينا أو وافقت صراحةً على استقبال ملفات المرشحين المطابقين لاحتياجها. لا نرسل لعناوين عشوائية.",
    },
    {
      icon: "mailCheck",
      title: "رسالة مخصصة لكل شركة",
      desc: "كل رسالة تُكتب بالذكاء الاصطناعي خصيصاً للشركة المستهدفة — باسمها ومجالها واحتياجها — وليست رسالة واحدة منسوخة لمئات الجهات.",
    },
    {
      icon: "eye",
      title: "أنت تعاين قبل الإرسال",
      desc: "تشاهد نموذج رسالة التواصل وقائمة الشركات المستهدفة وتوافق عليها قبل انطلاق الحملة. لا يُرسل شيء باسمك دون علمك.",
    },
    {
      icon: "shield",
      title: "التزام كامل بحماية البيانات",
      desc: "نعالج بياناتك وبيانات جهات التواصل وفق نظام حماية البيانات الشخصية السعودي (PDPL) ومبادئ GDPR — مع حق إيقاف الحملة أو حذف بياناتك في أي وقت.",
    },
  ],
  faqTitle: "أسئلة شائعة",
  faq: [
    {
      q: "هل سيبدو الإرسال كأنه سبام؟",
      a: "لا. الرسائل فردية ومخصصة وتُرسل لجهات اختارت استقبال ملفات المرشحين، وبمعدل إرسال طبيعي يحاكي التواصل البشري الاحترافي.",
    },
    {
      q: "هل أستطيع استثناء شركات معينة؟",
      a: "نعم، يمكنك مراجعة قائمة الشركات المستهدفة وحذف أي جهة لا تريد الوصول إليها قبل إطلاق الحملة — مثل جهة عملك الحالية.",
    },
    {
      q: "ماذا يحدث لبياناتي بعد الحملة؟",
      a: "تبقى بياناتك في حسابك وتحت سيطرتك. يمكنك طلب حذفها نهائياً في أي وقت عبر إعدادات الحساب أو بمراسلتنا.",
    },
  ],
  cta: "ابدأ حملتك الآن",
};

const EN = {
  badge: "Transparency First",
  h1: "How does Smart CV Marketing work?",
  sub: "It's not random bulk email — it's personalized, professional outreach that respects everyone's privacy. Here's exactly how we do it.",
  points: [
    {
      icon: "userCheck",
      title: "Companies are opted in",
      desc: "We only send your profile to companies and hiring contacts that registered with us or explicitly agreed to receive matching candidate profiles. We never send to random addresses.",
    },
    {
      icon: "mailCheck",
      title: "A personalized message per company",
      desc: "Every message is AI-written specifically for the target company — its name, industry, and needs — not one template copied to hundreds of recipients.",
    },
    {
      icon: "eye",
      title: "You preview before anything sends",
      desc: "You review the outreach message and the list of target companies and approve them before the campaign launches. Nothing is sent in your name without your knowledge.",
    },
    {
      icon: "shield",
      title: "Full data protection compliance",
      desc: "We process your data and contact data in line with the Saudi Personal Data Protection Law (PDPL) and GDPR principles — with the right to pause your campaign or delete your data at any time.",
    },
  ],
  faqTitle: "FAQ",
  faq: [
    {
      q: "Will it look like spam?",
      a: "No. Messages are individual, personalized, and sent to contacts who chose to receive candidate profiles, at a natural sending pace that mirrors professional human outreach.",
    },
    {
      q: "Can I exclude specific companies?",
      a: "Yes — you can review the target list and remove any company you don't want to reach before launching, such as your current employer.",
    },
    {
      q: "What happens to my data after the campaign?",
      a: "Your data stays in your account, under your control. You can request permanent deletion at any time from account settings or by contacting us.",
    },
  ],
  cta: "Start Your Campaign",
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

  return (
    <div dir={isAr ? "rtl" : "ltr"}>
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <SectionBadge>{t.badge}</SectionBadge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {t.h1}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-500">{t.sub}</p>
        </div>
      </section>

      <section className="bg-slate-50 py-16 md:py-20" id="how-we-do-it">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {t.points.map((p) => {
              const Icon = ICONS[p.icon as keyof typeof ICONS];
              return (
                <div
                  key={p.title}
                  className={`rounded-2xl border border-white bg-white p-6 shadow-sm ${isAr ? "text-right" : ""}`}
                >
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-light/40 text-teal ${isAr ? "mr-0 ml-auto" : ""}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mb-1 font-bold text-slate-950">{p.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-500">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className={`mx-auto max-w-3xl px-6 ${isAr ? "text-right" : ""}`}>
          <h2 className="mb-6 text-2xl font-black tracking-tight text-slate-950">{t.faqTitle}</h2>
          <div className="space-y-5">
            {t.faq.map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 pb-5 last:border-0">
                <p className="font-bold text-slate-950">{q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/dashboard/smart-send"
              className="inline-flex rounded-xl bg-teal px-7 py-3.5 text-sm font-bold text-white transition hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
            >
              {t.cta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
