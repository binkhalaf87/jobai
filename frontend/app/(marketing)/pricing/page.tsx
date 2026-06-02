import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";

/* ─── data ────────────────────────────────────────────────────────────── */
const FEATURE_PLANS_DATA = [
  { icon: "📊", price: 7, key: "analysis" },
  { icon: "✍️", price: 10, key: "improvement" },
  { icon: "🎤", price: 10, key: "interview" },
  { icon: "🔍", price: 0, key: "jobSearch" },
] as const;

const SMART_SEND_PLANS_DATA = [
  { companies: 500, price: 100, highlight: null },
  { companies: 1500, price: 200, highlight: "popular" as const },
  { companies: 3000, price: 269, highlight: "value" as const },
];

/* ─── types ───────────────────────────────────────────────────────────── */
type PricingContent = {
  meta: { title: string; description: string };
  hero: { label: string; h1: string; sub: string; cta: string };
  plans: {
    sectionTitle: string;
    sectionSub: string;
    free: string;
    oneTime: string;
    noPayment: string;
    currency: string;
    items: { name: string; description: string }[];
  };
  smartSend: {
    sectionTitle: string;
    sectionSub: string;
    companies: string;
    perCompany: string;
    currency: string;
    mostPopular: string;
    bestValue: string;
    oneTime: string;
    numLocale: string;
  };
  faq: { title: string; items: { q: string; a: string }[] };
  finalCta: { title: string; sub: string; cta: string };
};

/* ─── bilingual content ───────────────────────────────────────────────── */
const AR: PricingContent = {
  meta: {
    title: "الأسعار — JobAI",
    description: "ادفع لكل خدمة مرة واحدة فقط. تحليل السيرة الذاتية، تحسينها، تدريب المقابلة، والإرسال الذكي.",
  },
  hero: {
    label: "الأسعار",
    h1: "ادفع مرة واحدة فقط",
    sub: "بدون اشتراكات شهرية. ادفع لكل خدمة عند الحاجة فقط.",
    cta: "ابدأ مجاناً",
  },
  plans: {
    sectionTitle: "خدمات المسار المهني",
    sectionSub: "كل خدمة تُشترى بشكل مستقل للاستخدام مرة واحدة.",
    free: "مجاني",
    oneTime: "دفعة واحدة",
    noPayment: "لا يتطلب دفعاً",
    currency: "ريال",
    items: [
      { name: "تحليل السيرة الذاتية", description: "تحليل ذكي شامل لسيرتك الذاتية مع توصيات مخصصة." },
      { name: "تحسين السيرة الذاتية", description: "إعادة كتابة وتحسين سيرتك الذاتية باستخدام الذكاء الاصطناعي." },
      { name: "تدريب على المقابلة", description: "تدرب على المقابلات الوظيفية مع مساعد ذكاء اصطناعي." },
      { name: "البحث عن الوظائف", description: "استعرض آلاف الوظائف المناسبة لملفك الشخصي." },
    ],
  },
  smartSend: {
    sectionTitle: "💌 باقات الإرسال الذكي",
    sectionSub: "أرسل سيرتك الذاتية ورسائل توظيف مخصصة إلى مئات الشركات دفعةً واحدة.",
    companies: "شركة",
    perCompany: "هللة لكل شركة",
    currency: "ريال",
    mostPopular: "الأكثر شعبية",
    bestValue: "الأفضل قيمة",
    oneTime: "دفعة واحدة",
    numLocale: "ar-SA",
  },
  faq: {
    title: "أسئلة شائعة",
    items: [
      { q: "هل تنتهي صلاحية الكريديت؟", a: "لا، الكريديت الذي تشتريه يبقى في حسابك حتى تستخدمه." },
      { q: "هل يمكنني استرداد المبلغ؟", a: "في حال وجود مشكلة تقنية تمنعك من الاستفادة من الخدمة، تواصل معنا خلال 7 أيام." },
      { q: "ما وسائل الدفع المقبولة؟", a: "نقبل جميع البطاقات الائتمانية والمدى وApple Pay عبر Paymob." },
    ],
  },
  finalCta: {
    title: "جاهز للبدء؟",
    sub: "سجّل حساباً مجانياً وابدأ برحلتك المهنية اليوم.",
    cta: "إنشاء حساب مجاني",
  },
};

const EN: PricingContent = {
  meta: {
    title: "Pricing — JobAI",
    description: "Pay once per service. Resume analysis, enhancement, interview training, and smart send.",
  },
  hero: {
    label: "Pricing",
    h1: "Pay Once, Use Forever",
    sub: "No monthly subscriptions. Pay per service, only when you need it.",
    cta: "Start Free",
  },
  plans: {
    sectionTitle: "Career Services",
    sectionSub: "Each service is purchased independently for single use.",
    free: "Free",
    oneTime: "One-time",
    noPayment: "No payment required",
    currency: "SAR",
    items: [
      { name: "Resume Analysis", description: "Comprehensive AI-powered resume analysis with personalized recommendations." },
      { name: "Resume Improvement", description: "AI-powered rewrite and enhancement of your resume." },
      { name: "Interview Training", description: "Practice job interviews with an AI assistant." },
      { name: "Job Search", description: "Browse thousands of jobs matched to your profile." },
    ],
  },
  smartSend: {
    sectionTitle: "💌 Smart Send Packages",
    sectionSub: "Send your resume and personalized cover letters to hundreds of companies at once.",
    companies: "companies",
    perCompany: "halalas per company",
    currency: "SAR",
    mostPopular: "Most Popular",
    bestValue: "Best Value",
    oneTime: "One-time",
    numLocale: "en-US",
  },
  faq: {
    title: "FAQ",
    items: [
      { q: "Do credits expire?", a: "No, credits you purchase remain in your account until you use them." },
      { q: "Can I get a refund?", a: "If a technical issue prevents you from using the service, contact us within 7 days." },
      { q: "What payment methods are accepted?", a: "We accept all credit cards, Mada, and Apple Pay via Paymob." },
    ],
  },
  finalCta: {
    title: "Ready to start?",
    sub: "Create a free account and begin your career journey today.",
    cta: "Create Free Account",
  },
};

/* ─── metadata ────────────────────────────────────────────────────────── */
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = locale === "ar" ? AR : EN;
  return { title: c.meta.title, description: c.meta.description };
}

/* ─── page ────────────────────────────────────────────────────────────── */
export default async function PricingPage() {
  const locale = await getLocale();
  const c = locale === "ar" ? AR : EN;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div className="min-h-screen bg-slate-50" dir={dir}>
      {/* Hero */}
      <div className="bg-white border-b border-slate-100 py-16 px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3">{c.hero.label}</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          {c.hero.h1}
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
          {c.hero.sub}
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-800 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-700 transition"
        >
          {c.hero.cta}
          <span>{locale === "ar" ? "←" : "→"}</span>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* Feature plans */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{c.plans.sectionTitle}</h2>
          <p className="text-slate-500 mb-8">{c.plans.sectionSub}</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_PLANS_DATA.map((plan, i) => {
              const item = c.plans.items[i];
              return (
                <div
                  key={plan.key}
                  className="rounded-2xl border border-slate-200 bg-white p-6 text-right flex flex-col"
                >
                  <div className="text-3xl mb-3">{plan.icon}</div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
                  <p className="mt-2 text-sm text-slate-500 flex-1">{item.description}</p>
                  <div className="mt-4">
                    {plan.price === 0 ? (
                      <p className="text-2xl font-bold text-emerald-600">{c.plans.free}</p>
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">
                        {plan.price} <span className="text-base font-normal text-slate-500">{c.plans.currency}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {plan.price === 0 ? c.plans.noPayment : c.plans.oneTime}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Smart send */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{c.smartSend.sectionTitle}</h2>
          <p className="text-slate-500 mb-8">{c.smartSend.sectionSub}</p>
          <div className="grid gap-5 sm:grid-cols-3">
            {SMART_SEND_PLANS_DATA.map((plan) => (
              <div
                key={plan.companies}
                className={`rounded-2xl border p-6 text-right relative ${
                  plan.highlight === "popular"
                    ? "border-brand-300 bg-brand-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 right-5 rounded-full bg-brand-800 px-3 py-0.5 text-xs font-semibold text-white">
                    {plan.highlight === "popular" ? c.smartSend.mostPopular : c.smartSend.bestValue}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.companies.toLocaleString(c.smartSend.numLocale)} {c.smartSend.companies}
                </h3>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {plan.price} <span className="text-base font-normal text-slate-500">{c.smartSend.currency}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">{c.smartSend.oneTime}</p>
                <p className="mt-3 text-sm text-slate-500">
                  {(plan.price / plan.companies * 1000).toFixed(1)} {c.smartSend.perCompany}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-2xl bg-white border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{c.faq.title}</h2>
          <div className="space-y-5">
            {c.faq.items.map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <p className="font-semibold text-slate-900">{q}</p>
                <p className="mt-1 text-sm text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">{c.finalCta.title}</h2>
          <p className="text-slate-500 mb-6">{c.finalCta.sub}</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-800 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-700 transition"
          >
            {c.finalCta.cta}
            <span>{locale === "ar" ? "←" : "→"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
