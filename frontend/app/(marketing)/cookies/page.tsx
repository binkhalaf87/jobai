import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr ? "سياسة ملفات تعريف الارتباط — JobAI24" : "Cookie Policy — JobAI24",
    description: isAr
      ? "كيف يستخدم JobAI24 ملفات تعريف الارتباط (الكوكيز)."
      : "How JobAI24 uses cookies.",
  };
}

const AR = {
  h1: "سياسة ملفات تعريف الارتباط",
  updated: "آخر تحديث: يونيو ٢٠٢٦",
  sections: [
    {
      h: "ما هي ملفات تعريف الارتباط؟",
      p: "ملفات تعريف الارتباط (الكوكيز) هي ملفات نصية صغيرة تُحفظ على جهازك عند زيارة الموقع، وتساعدنا على تشغيل المنصة بشكل صحيح وتحسين تجربتك.",
    },
    {
      h: "كيف نستخدمها؟",
      p: "نستخدم ملفات تعريف ارتباط ضرورية لتسجيل الدخول والحفاظ على جلستك وتفضيل اللغة. لا نستخدم ملفات تعريف ارتباط إعلانية من أطراف ثالثة.",
    },
    {
      h: "التحكم في ملفات تعريف الارتباط",
      p: "يمكنك حذف أو حظر ملفات تعريف الارتباط من إعدادات المتصفح، علماً بأن حظر الملفات الضرورية قد يمنع تسجيل الدخول واستخدام المنصة.",
    },
  ],
  contact: "لأي استفسار حول هذه السياسة، راسلنا على",
};

const EN = {
  h1: "Cookie Policy",
  updated: "Last updated: June 2026",
  sections: [
    {
      h: "What are cookies?",
      p: "Cookies are small text files stored on your device when you visit the site. They help us run the platform correctly and improve your experience.",
    },
    {
      h: "How we use them",
      p: "We use essential cookies for sign-in, keeping your session active, and remembering your language preference. We do not use third-party advertising cookies.",
    },
    {
      h: "Controlling cookies",
      p: "You can delete or block cookies from your browser settings. Note that blocking essential cookies may prevent sign-in and use of the platform.",
    },
  ],
  contact: "For any questions about this policy, email us at",
};

export default async function CookiesPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const t = isAr ? AR : EN;

  return (
    <section className="bg-white py-16 md:py-24" dir={isAr ? "rtl" : "ltr"}>
      <div className={`mx-auto max-w-3xl px-6 ${isAr ? "text-right" : ""}`}>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{t.h1}</h1>
        <p className="mt-2 text-sm text-slate-400">{t.updated}</p>

        <div className="mt-10 space-y-8">
          {t.sections.map((s) => (
            <div key={s.h}>
              <h2 className="mb-2 text-lg font-bold text-slate-950">{s.h}</h2>
              <p className="text-base leading-relaxed text-slate-600">{s.p}</p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">
          {t.contact}{" "}
          <Link href="mailto:hello@jobai24.com" className="font-semibold text-brand-600 hover:text-brand-700">
            hello@jobai24.com
          </Link>
        </p>
      </div>
    </section>
  );
}
