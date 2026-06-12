import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

import { SectionBadge } from "@/components/marketing/section-badge";

export const metadata: Metadata = {
  title: "من نحن — JobAI24",
  description:
    "JobAI24 منصة مهنية بالذكاء الاصطناعي صُنعت في السعودية لمساعدة الباحثين عن عمل على تجاوز أنظمة ATS والحصول على مقابلات أكثر.",
};

const AR = {
  badge: "من نحن",
  h1: "نساعدك على الوصول إلى الوظيفة التي تستحقها",
  mission: [
    "JobAI24 منصة مهنية بالذكاء الاصطناعي صُنعت في المملكة العربية السعودية، وُلدت من مشكلة حقيقية: أكثر من ٧٥٪ من السير الذاتية تُرفض آلياً بواسطة أنظمة تتبع المتقدمين (ATS) قبل أن يراها أي إنسان. كفاءات ممتازة تضيع فرصها ليس لنقص في المهارة، بل لأن سيرتها الذاتية لم تُكتب بالطريقة التي تفهمها هذه الأنظمة.",
    "مهمتنا بسيطة: أن نمنح كل باحث عن عمل في السعودية والخليج نفس الأدوات التي تستخدمها الشركات الكبرى — تحليل ATS دقيق، تحسين احترافي للسيرة، خطابات تقديم مخصصة، وتسويق ذكي يوصل ملفك إلى أصحاب العمل المناسبين مباشرة.",
    "نبني المنصة بلغتك، ولسوق عملك، وبفهم عميق لما يبحث عنه أصحاب العمل في المنطقة.",
  ],
  cta: "ابدأ رحلتك مجاناً",
};

const EN = {
  badge: "About Us",
  h1: "We help you reach the job you deserve",
  mission: [
    "JobAI24 is an AI-powered career platform built in Saudi Arabia, born from a real problem: over 75% of resumes are automatically rejected by Applicant Tracking Systems (ATS) before a human ever sees them. Talented candidates lose opportunities not for lack of skill, but because their resume wasn't written in a way these systems understand.",
    "Our mission is simple: give every job seeker in Saudi Arabia and the Gulf the same tools large companies use — precise ATS analysis, professional resume enhancement, tailored cover letters, and smart marketing that delivers your profile directly to the right employers.",
    "We build the platform in your language, for your job market, with a deep understanding of what employers in the region are looking for.",
  ],
  cta: "Start Your Journey — Free",
};

export default async function AboutPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;

  return (
    <section className="bg-white py-20 md:py-28">
      <div className={`mx-auto max-w-3xl px-6 ${isAr ? "text-right" : ""}`}>
        <div className="text-center">
          <SectionBadge>{t.badge}</SectionBadge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {t.h1}
          </h1>
        </div>

        <div className="mt-10 space-y-6">
          {t.mission.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-slate-600 md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex rounded-xl bg-brand-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200/50"
          >
            {t.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
