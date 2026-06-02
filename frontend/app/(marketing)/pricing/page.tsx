import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "الأسعار — JobAI",
  description: "ادفع لكل خدمة مرة واحدة فقط. تحليل السيرة الذاتية، تحسينها، تدريب المقابلة، والإرسال الذكي.",
};

const FEATURE_PLANS = [
  {
    icon: "📊",
    name: "تحليل السيرة الذاتية",
    nameEn: "Resume Analysis",
    price: 7,
    description: "تحليل ذكي شامل لسيرتك الذاتية مع توصيات مخصصة.",
    highlight: false,
  },
  {
    icon: "✍️",
    name: "تحسين السيرة الذاتية",
    nameEn: "Resume Improvement",
    price: 10,
    description: "إعادة كتابة وتحسين سيرتك الذاتية باستخدام الذكاء الاصطناعي.",
    highlight: false,
  },
  {
    icon: "🎤",
    name: "تدريب على المقابلة",
    nameEn: "Mock Interview",
    price: 10,
    description: "تدرب على المقابلات الوظيفية مع مساعد ذكاء اصطناعي.",
    highlight: false,
  },
  {
    icon: "🔍",
    name: "البحث عن الوظائف",
    nameEn: "Job Search",
    price: 0,
    description: "استعرض آلاف الوظائف المناسبة لملفك الشخصي.",
    highlight: false,
  },
];

const SMART_SEND_PLANS = [
  {
    companies: 500,
    price: 100,
    label: null,
  },
  {
    companies: 1500,
    price: 200,
    label: "الأكثر شعبية",
  },
  {
    companies: 3000,
    price: 269,
    label: "الأفضل قيمة",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Hero */}
      <div className="bg-white border-b border-slate-100 py-16 px-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3">الأسعار</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          ادفع مرة واحدة فقط
        </h1>
        <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
          بدون اشتراكات شهرية. ادفع لكل خدمة عند الحاجة فقط.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-brand-800 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-700 transition"
        >
          ابدأ مجاناً
          <span>←</span>
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        {/* Feature plans */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">خدمات المسار المهني</h2>
          <p className="text-slate-500 mb-8">كل خدمة تُشترى بشكل مستقل للاستخدام مرة واحدة.</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_PLANS.map((plan) => (
              <div
                key={plan.name}
                className="rounded-2xl border border-slate-200 bg-white p-6 text-right flex flex-col"
              >
                <div className="text-3xl mb-3">{plan.icon}</div>
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-slate-500 flex-1">{plan.description}</p>
                <div className="mt-4">
                  {plan.price === 0 ? (
                    <p className="text-2xl font-bold text-emerald-600">مجاني</p>
                  ) : (
                    <p className="text-2xl font-bold text-slate-900">
                      {plan.price} <span className="text-base font-normal text-slate-500">ريال</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {plan.price === 0 ? "لا يتطلب دفعاً" : "دفعة واحدة"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Smart send */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">💌 باقات الإرسال الذكي</h2>
          <p className="text-slate-500 mb-8">
            أرسل سيرتك الذاتية ورسائل توظيف مخصصة إلى مئات الشركات دفعةً واحدة.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {SMART_SEND_PLANS.map((plan) => (
              <div
                key={plan.companies}
                className={`rounded-2xl border p-6 text-right relative ${
                  plan.label === "الأكثر شعبية"
                    ? "border-brand-300 bg-brand-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.label && (
                  <span className="absolute -top-3 right-5 rounded-full bg-brand-800 px-3 py-0.5 text-xs font-semibold text-white">
                    {plan.label}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">
                  {plan.companies.toLocaleString("ar-SA")} شركة
                </h3>
                <p className="mt-4 text-3xl font-bold text-slate-900">
                  {plan.price} <span className="text-base font-normal text-slate-500">ريال</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">دفعة واحدة</p>
                <p className="mt-3 text-sm text-slate-500">
                  {(plan.price / plan.companies * 1000).toFixed(1)} هللة لكل شركة
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ / notes */}
        <section className="rounded-2xl bg-white border border-slate-200 p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">أسئلة شائعة</h2>
          <div className="space-y-5">
            {[
              {
                q: "هل تنتهي صلاحية الكريديت؟",
                a: "لا، الكريديت الذي تشتريه يبقى في حسابك حتى تستخدمه.",
              },
              {
                q: "هل يمكنني استرداد المبلغ؟",
                a: "في حال وجود مشكلة تقنية تمنعك من الاستفادة من الخدمة، تواصل معنا خلال 7 أيام.",
              },
              {
                q: "ما وسائل الدفع المقبولة؟",
                a: "نقبل جميع البطاقات الائتمانية والمدى وApple Pay عبر Paymob.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                <p className="font-semibold text-slate-900">{q}</p>
                <p className="mt-1 text-sm text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">جاهز للبدء؟</h2>
          <p className="text-slate-500 mb-6">سجّل حساباً مجانياً وابدأ برحلتك المهنية اليوم.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-800 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-700 transition"
          >
            إنشاء حساب مجاني
            <span>←</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
