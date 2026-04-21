import Link from "next/link";
import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";
import { useTranslations } from "next-intl";
import { 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  FileText, 
  Target, 
  Zap, 
  BarChart3, 
  ShieldCheck, 
  Briefcase,
  Users2
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations("marketing");

  return (
    <PageContainer className="space-y-28 pb-20">
      {/* 1. Hero Section - Ultra Clean & Professional */}
      <section className="relative pt-12 pb-20 md:pt-20">
        <div className="absolute inset-0 -z-10 mx-auto max-w-7xl overflow-hidden blur-3xl">
          <div className="absolute -top-24 right-0 h-[400px] w-[600px] bg-brand-100/50 opacity-50" />
          <div className="absolute top-0 left-0 h-[300px] w-[500px] bg-blue-50/50 opacity-40" />
        </div>

        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/50 px-4 py-1.5 text-sm font-semibold text-brand-700">
            <Sparkles className="h-4 w-4" />
            <span>نظام التوظيف الذكي الأول في المملكة</span>
          </div>
          
          <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900 md:text-7xl">
            ارتقِ بمسارك المهني عبر <br />
            <span className="text-brand-600">قوة الذكاء الاصطناعي</span>
          </h1>

          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
            نقدم لك أدوات متقدمة لتحليل السيرة الذاتية، وتحسين التوافق مع أنظمة الـ ATS، 
            والوصول إلى الفرص الوظيفية التي تناسب مهاراتك بدقة متناهية.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-brand-600 px-10 text-base font-bold text-white shadow-xl shadow-brand-200 transition-all hover:bg-brand-700 hover:-translate-y-0.5"
            >
              ابدأ الآن مجاناً
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-10 text-base font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
            >
              تجربة المنصة
            </Link>
          </div>

          <div className="pt-8 flex flex-wrap justify-center items-center gap-x-12 gap-y-6 grayscale opacity-60">
            <span className="text-sm font-bold text-slate-400">موصى به من قبل خبراء التوظيف في:</span>
            <div className="flex gap-8">
              {/* أيقونات وهمية أو نصوص للشركات لتعزيز الموثوقية */}
              <div className="font-black text-xl tracking-tighter">TECH.CO</div>
              <div className="font-black text-xl tracking-tighter">GLOBAL.SA</div>
              <div className="font-black text-xl tracking-tighter">MODERN.HR</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Services - Grid Layout */}
      <section className="space-y-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">خدماتنا الاحترافية</h2>
            <h3 className="text-4xl font-bold text-slate-900">حلول متكاملة لكل مرحلة من رحلة بحثك عن عمل</h3>
          </div>
          <p className="max-w-xs text-sm text-slate-500 leading-relaxed">
            تم تصميم كل أداة لتعمل بانسجام مع سوق العمل السعودي ومعايير التوظيف العالمية.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            { 
              icon: <FileText className="h-6 w-6" />, 
              title: "تحليل السيرة الذاتية (CV)", 
              desc: "فحص شامل لأكثر من 50 معياراً تقنياً لضمان عبور ملفك من خلال أنظمة الـ ATS الذكية.",
              color: "text-blue-600",
              bg: "bg-blue-50"
            },
            { 
              icon: <Target className="h-6 w-6" />, 
              title: "مطابقة الوظائف الذكية", 
              desc: "خوارزميات متقدمة تربط مهاراتك الحالية بالوظائف الأكثر طلباً والأعلى أجراً في السوق.",
              color: "text-brand-600",
              bg: "bg-brand-50"
            },
            { 
              icon: <Zap className="h-6 w-6" />, 
              title: "توليد المحتوى المهني", 
              desc: "إنشاء رسائل تغطية (Cover Letters) مخصصة لكل وظيفة بناءً على متطلبات الوصف الوظيفي.",
              color: "text-amber-600",
              bg: "bg-amber-50"
            }
          ].map((item, idx) => (
            <div key={idx} className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:shadow-md hover:border-brand-100">
              <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${item.bg} ${item.color}`}>
                {item.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h4>
              <p className="text-slate-500 text-sm leading-7">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Features Detail - Side by Side */}
      <section className="rounded-[3rem] bg-slate-50 px-8 py-20 md:px-16 overflow-hidden relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">لماذا يختار المحترفون منصتنا؟</h2>
            <div className="space-y-6">
              {[
                { title: "تقارير دقيقة ولحظية", desc: "احصل على نتائج التحليل في أقل من 30 ثانية مع نقاط قوة وضعف واضحة.", icon: <BarChart3 /> },
                { title: "دعم كامل للغة العربية", desc: "أول منصة تعالج اللغة العربية تقنياً بنفس كفاءة اللغة الإنجليزية.", icon: <Users2 /> },
                { title: "أمن وخصوصية البيانات", desc: "نستخدم تشفيراً بمعايير بنكية لحماية بياناتك المهنية وسيرتك الذاتية.", icon: <ShieldCheck /> }
              ].map((feature, i) => (
                <div key={i} className="flex gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm">
                    {feature.icon}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900">{feature.title}</h5>
                    <p className="text-sm text-slate-500 mt-1">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
             <div className="rounded-3xl border-8 border-white bg-white shadow-2xl">
                <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden">
                   {/* محاكاة لواجهة الداشبورد بشكل مبسط */}
                   <div className="flex justify-between items-center mb-8">
                      <div className="h-2 w-24 bg-slate-700 rounded" />
                      <div className="h-6 w-16 bg-brand-500 rounded-full" />
                   </div>
                   <div className="space-y-4">
                      <div className="h-32 bg-slate-800 rounded-xl border border-slate-700 p-4">
                        <div className="flex gap-3 h-full">
                           <div className="w-12 h-12 rounded bg-brand-500/20 border border-brand-500/50" />
                           <div className="flex-1 space-y-3 pt-2">
                              <div className="h-2 w-full bg-slate-700 rounded" />
                              <div className="h-2 w-2/3 bg-slate-700 rounded" />
                           </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-slate-800 rounded-xl border border-slate-700" />
                        <div className="h-20 bg-slate-800 rounded-xl border border-slate-700" />
                      </div>
                   </div>
                </div>
             </div>
             {/* زينة خلفية */}
             <div className="absolute -bottom-6 -right-6 -z-10 h-64 w-64 rounded-full bg-brand-200/50 blur-3xl" />
          </div>
        </div>
      </section>

      {/* 4. Latest Opportunities - List Style */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">أحدث الفرص المطابقة لنظامنا</h2>
          <p className="text-slate-500">تم تحليل هذه الوظائف بدقة لتناسب معايير الجودة لدينا</p>
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { title: "مدير مشاريع تقنية", company: "حلول البرمجيات المتقدمة", loc: "الرياض", type: "دوام كامل" },
            { title: "محلل بيانات أول", company: "مجموعة الابتكار الرقمي", loc: "جدة", type: "عن بعد" },
            { title: "مصمم واجهات UX/UI", company: "وكالة التصميم الإبداعي", loc: "الدمام", type: "دوام كامل" }
          ].map((job, idx) => (
            <div key={idx} className="flex items-center justify-between p-6 rounded-2xl border border-slate-100 bg-white transition hover:border-brand-200 hover:bg-slate-50/50">
              <div className="flex gap-4 items-center">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{job.title}</h4>
                  <p className="text-xs text-slate-500">{job.company} • {job.loc}</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-full">{job.type}</span>
            </div>
          ))}
          <div className="text-center pt-4">
            <button className="text-sm font-bold text-brand-600 hover:underline">عرض كافة الوظائف المتاحة ←</button>
          </div>
        </div>
      </section>

      {/* 5. Trust Bar / Social Proof */}
      <section className="rounded-[2.5rem] border border-slate-100 bg-white p-12 text-center shadow-sm">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center gap-1 text-amber-400">
            {[...Array(5)].map((_, i) => <Sparkles key={i} className="h-5 w-5 fill-current" />)}
          </div>
          <blockquote className="text-xl font-medium text-slate-800 leading-relaxed italic">
            "ساعدتني هذه المنصة في الوصول لمرحلة المقابلات الشخصية في 3 شركات كبرى في أقل من شهر بعد أن كنت أعاني من رفض الـ ATS المتكرر."
          </blockquote>
          <div>
            <p className="font-bold text-slate-900">سارة الأحمد</p>
            <p className="text-sm text-slate-500">أخصائية تسويق رقمي</p>
          </div>
        </div>
      </section>

      {/* 6. Final CTA - Impactful */}
      <section className="relative overflow-hidden rounded-[3rem] bg-brand-600 px-8 py-16 text-center text-white shadow-2xl shadow-brand-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-30" />
        <div className="relative z-10 space-y-8">
          <h2 className="text-3xl font-bold md:text-5xl">جاهز لتحويل مستقبلك المهني؟</h2>
          <p className="mx-auto max-w-xl text-brand-100 text-lg">
            انضم إلى آلاف المحترفين الذين يستخدمون أدواتنا الذكية يومياً للحصول على وظائف أحلامهم.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              href="/register" 
              className="rounded-2xl bg-white px-10 py-4 text-base font-bold text-brand-600 shadow-xl transition hover:scale-105 active:scale-95"
            >
              ابدأ الآن مجاناً
            </Link>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
