import Link from "next/link";

import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";

const SERVICES = [
  {
    title: "بحث عن وظيفة",
    description: "اعثر على الفرص التي تتوافق مع ملفك المهني ومهاراتك.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    )
  },
  {
    title: "تحليل السيرة الذاتية",
    description: "احصل على تقييم ذكي للسيرة مع تحسين المقاطع الضعيفة.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M9 12h6" />
        <path d="M9 16h4" />
        <path d="M13 6h6" />
        <path d="M5 21h14a2 2 0 0 0 2-2V7.5L15.5 2H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2z" />
      </svg>
    )
  },
  {
    title: "مطابقة الوظائف",
    description: "تطابق بين سيرتك والوظائف الأقرب لخبراتك وقيمك المهنية.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
        <path d="M21 15V5a2 2 0 0 0-2-2H11" />
        <path d="M7 7H3v14a2 2 0 0 0 2 2h14v-4" />
        <path d="M14 3l7 7" />
      </svg>
    )
  }
];

const FEATURES = [
  {
    title: "مبني على الذكاء الاصطناعي",
    description: "أنظمة تعلم ذاتي لتحليل السيرة ومطابقة الوظائف بدقة.",
    badge: "تقني"
  },
  {
    title: "واجهة بسيطة وسريعة",
    description: "تصميم نظيف يمنحك تجربة منظمة ووصولاً سريعاً للمعلومة.",
    badge: "سهل"
  },
  {
    title: "دعم RTL وعربي كامل",
    description: "محتوى مصمم للعربية مع محاذاة من اليمين وتدفق طبيعي.",
    badge: "مخصص"
  }
];

const JOBS = [
  {
    title: "محلل قدرات ذكاء اصطناعي",
    company: "شركة Elm Tech",
    location: "الرياض",
    type: "دوام كامل"
  },
  {
    title: "مهندس تطوير توظيف",
    company: "CareFusion",
    location: "جدة",
    type: "دوام جزئي"
  },
  {
    title: "مدير تجربة المستخدم",
    company: "AI Talent",
    location: "الدمام",
    type: "عن بعد"
  }
];

export default function HomePage() {
  return (
    <PageContainer className="space-y-16">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-700 to-slate-950 px-6 py-10 text-white shadow-soft md:px-12 md:py-16">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top_left,_rgba(140,92,247,0.22),transparent_40%)]" />
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-100/90">
              منصة توظيف ذكية
            </span>
            <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
              وفر الوقت وابن مسارك المهني مع توظيفٍ ذكي يعتمد على الذكاء الاصطناعي
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-100/85 md:text-lg">
              JobAI تقدم تجربة عربية حديثة تجمع بين احترافية Elm والطابع التقني لمنتجات SaaS، حتى تجد الوظيفة المناسبة وتتحكم في تفاصيل مسارك بسهولة.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/15 transition hover:bg-slate-100"
              >
                ابدأ الآن
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                جولة سريعة
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 shadow-panel">
                <p className="text-3xl font-semibold">35%</p>
                <p className="mt-1 text-slate-200">أسرع في العثور على التطابق الأمثل</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 shadow-panel">
                <p className="text-3xl font-semibold">120+</p>
                <p className="mt-1 text-slate-200">شهادة سيرة ذاتية ذكية تم تحليلها</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 shadow-panel">
                <p className="text-3xl font-semibold">8.9/10</p>
                <p className="mt-1 text-slate-200">رضا المستخدمين عن الاقتراحات الذكية</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm sm:p-8">
              <div className="mb-6 flex items-center justify-between rounded-3xl bg-white/10 p-4 text-sm text-slate-100">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-200/80">وظيفتك القادمة</p>
                  <p className="mt-1 text-base font-semibold text-white">محلل بيانات ذكاء اصطناعي</p>
                </div>
                <div className="rounded-2xl bg-brand-800 px-3 py-2 text-xs font-semibold text-white">مرشح</div>
              </div>
              <div className="grid gap-4">
                <div className="space-y-2 rounded-3xl bg-slate-900/60 p-5">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">CV</span>
                    <span>تحليل السيرة الذاتية الذكي</span>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-950/90 p-4 text-sm text-slate-200">
                    <p className="font-semibold">التوصيات</p>
                    <p className="mt-2 text-xs text-slate-400">نقاط القوة، الكلمات المفتاحية، ومقاطع العمل الأفضل.</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 text-sm text-slate-200">
                  <p className="font-semibold">المهارات المطابقة</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {['Python','Data','AI','SQL'].map((skill) => (
                      <span key={skill} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100">{skill}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-brand-500/20 bg-white/5 p-5 text-sm text-slate-100">
                  <p className="text-xs uppercase tracking-[0.24em] text-brand-200">دعوة لتجربة</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100/90">
                    تجربة بحث ذكي ومطابقة دقيقة مع فرص وظيفية تتوافق مع ملفك المهني.
                  </p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-10 top-10 h-16 w-16 rounded-full bg-brand-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-tech-light opacity-80 blur-3xl" />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-800/90">خدماتنا</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">أدوات توظيف متكاملة لكل مرحلة</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            من تحليل السيرة إلى مطابقة الوظائف وإنشاء ملف احترافي، كل شيء في مكان واحد.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {SERVICES.map((service) => (
            <Panel key={service.title} className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-panel">
              <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-100">
                {service.icon}
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-950">{service.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                عرض التفاصيل
                <span aria-hidden="true">→</span>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">لوحة المستخدم</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">لمحة عن أداء حسابك</h2>
            </div>
            <div className="inline-flex items-center gap-3 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
              <span className="h-2.5 w-2.5 rounded-full bg-mint"></span>
              تجربة الذكاء الاصطناعي
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">التطابق اليوم</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">82%</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">فرص تم تقديمها لك اليوم</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">السيرة الخاصة بك</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">95</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">درجة التوافق والوضوح</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">اقتراحات الوظائف</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">14</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">فرص مناسبة لنمطك المهني</p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">مرشحك الأقوى اليوم</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">مهندس ذكاء اصطناعي لفرصة في الرياض مع معدلات مقابلة عالية.</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">النصيحة السريعة</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">أضف كلمات الخبرة الحديثة لتعزيز تطابقك مع الوظائف التقنية.</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">أحدث الإعلانات</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">فرص مناسبة في مجال الذكاء الاصطناعي</h3>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">محدثة</span>
            </div>
            <div className="mt-6 space-y-4">
              {JOBS.map((job) => (
                <div key={job.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{job.title}</h4>
                      <p className="mt-2 text-sm text-slate-600">{job.company} · {job.location}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{job.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-brand-50 p-6 text-slate-950">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">لماذا JobAI؟</p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
              <li>• تجربة مصممة للعربية وRTL من البداية.</li>
              <li>• تصميم بسيط وواجهة منظمة للتركيز على المهم.</li>
              <li>• أتمتة ذكاء اصطناعي تساعدك في كل خطوة.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_0.7fr] lg:items-center">
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-800">ابدأ الآن</p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              اجعل بحثك عن الوظيفة أقصر وأكثر دقة
            </h2>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              استكشف فرصاً دقيقة، طور سيرتك، وابدأ رحلتك الوظيفية بثقة مع واجهة مصممة لأكثر المستخدمين طموحاً.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex min-w-[160px] items-center justify-center rounded-full bg-brand-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
              سجّل الآن
            </Link>
            <Link href="/login" className="inline-flex min-w-[160px] items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
              تسجيل دخول
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
