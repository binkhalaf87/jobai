"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  FileText,
  Target,
  Zap,
  BarChart3,
  ShieldCheck,
  Briefcase,
  Users2,
  XCircle,
  TrendingUp,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Send,
  Brain,
  Award,
  AlertTriangle,
  Rocket,
} from "lucide-react";

/* ─────────────────────────────── helpers ───────────────────────────────── */

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-bold text-brand-700 ${className}`}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-600 mb-3">
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HOMEPAGE
══════════════════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="overflow-x-hidden" dir="rtl">
      <HeroSection />
      <StatsBar />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <WhyNowSection />
      <ResultsSection />
      <TestimonialsSection />
      <PricingSection />
      <FaqSection />
      <FinalCta />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   1. HERO
══════════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white pt-14 pb-24 md:pt-20 md:pb-32">
      {/* Background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute top-60 -left-20 h-[400px] w-[500px] rounded-full bg-teal-light/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        {/* Eyebrow */}
        <Badge className="mb-6">
          <Sparkles className="h-4 w-4 text-brand-500" />
          نظام التوظيف الذكي #١ في المملكة العربية السعودية
        </Badge>

        {/* Headline — hits the pain first */}
        <h1 className="text-[2.6rem] font-black leading-[1.1] tracking-tight text-slate-900 md:text-7xl">
          كم مرة أرسلت سيرتك الذاتية
          <br />
          <span className="text-brand-600">ولم تتلقَّ أي ردّ؟</span>
        </h1>

        {/* Sub */}
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
          <strong className="text-slate-900">JobAI</strong> يحلل سيرتك في أقل من ٣٠ ثانية، يكشف نقاط الضعف الخفية،
          يعيد كتابتها لتخترق أنظمة ATS، ويضاعف فرصك في الحصول على مقابلة —
          <span className="text-brand-600 font-bold"> كل ذلك بالذكاء الاصطناعي.</span>
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-brand-600 px-10 text-base font-black text-white shadow-xl shadow-brand-200 transition-all hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0"
          >
            حلّل سيرتك الذاتية مجاناً الآن
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-14 items-center rounded-2xl border-2 border-slate-200 bg-white px-10 text-base font-bold text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
          >
            لديّ حساب — سجّل الدخول
          </Link>
        </div>

        {/* Micro trust signals */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500">
          {["لا يشترط بطاقة ائتمانية", "نتائج في ٣٠ ثانية", "+٥٠٠٠ محترف يثقون بنا"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal" />
              {t}
            </span>
          ))}
        </div>

        {/* Social proof avatars */}
        <div className="mt-10 flex justify-center items-center gap-3">
          <div className="flex -space-x-3 space-x-reverse">
            {["M", "S", "A", "F", "R"].map((l, i) => (
              <div
                key={i}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-black text-white shadow"
              >
                {l}
              </div>
            ))}
          </div>
          <div className="text-right">
            <div className="flex gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <strong className="text-slate-700">٤.٩/٥</strong> — آراء ٥٠٠+ مستخدم
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. STATS BAR
══════════════════════════════════════════════════════════════════════════ */
function StatsBar() {
  const stats = [
    { num: "+٥٠٠٠", label: "محترف يستخدم المنصة" },
    { num: "٩٢٪", label: "يصلون لمرحلة المقابلة" },
    { num: "٣٠ ث", label: "متوسط وقت التحليل" },
    { num: "+٥٠", label: "معيار تقييم للـ ATS" },
  ];

  return (
    <div className="border-y border-slate-100 bg-slate-50/60 py-8">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-brand-600">{s.num}</div>
              <div className="mt-1 text-sm text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   3. PROBLEM SECTION
══════════════════════════════════════════════════════════════════════════ */
function ProblemSection() {
  const pains = [
    {
      icon: <XCircle className="h-6 w-6 text-red-500" />,
      bg: "bg-red-50",
      title: "الرفض بدون سبب",
      desc: "ترسل عشرات الطلبات وتسمع صمتاً مطبقاً. أنظمة ATS ترفض CV قبل أن تراه أي عين بشرية.",
    },
    {
      icon: <AlertTriangle className="h-6 w-6 text-amber-500" />,
      bg: "bg-amber-50",
      title: "لا تعرف أين الخلل",
      desc: "سيرتك الذاتية تبدو جيدة في عيونك، لكنك لا تعلم لماذا تُرفض — الأرقام، الكلمات، التنسيق؟",
    },
    {
      icon: <Users2 className="h-6 w-6 text-purple-500" />,
      bg: "bg-purple-50",
      title: "منافسة شرسة",
      desc: "الوظيفة الواحدة تستقطب مئات المتقدمين. فرصتك تضيع في الزحام إذا لم تتميّز منذ السطر الأول.",
    },
    {
      icon: <FileText className="h-6 w-6 text-slate-500" />,
      bg: "bg-slate-100",
      title: "Cover Letter مكرر",
      desc: "رسائل التقديم المتكررة تفقد تأثيرها. ولا وقت لكتابة رسالة مخصصة لكل وظيفة يدوياً.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <SectionLabel>المشكلة الحقيقية</SectionLabel>
          <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
            لماذا يُرفض <span className="text-red-500">٨٠٪</span> من المتقدمين
            <br />قبل أن يراهم أحد؟
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            المشكلة ليست في مهاراتك — المشكلة في طريقة تقديمها. وهذا بالضبط ما نصلحه.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {pains.map((p) => (
            <div key={p.title} className={`rounded-2xl ${p.bg} p-7 border border-slate-100`}>
              <div className="flex gap-4 items-start">
                <div className="mt-0.5 shrink-0">{p.icon}</div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg mb-2">{p.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Agitate */}
        <div className="mt-10 rounded-2xl border-2 border-red-100 bg-red-50/40 p-6 text-center">
          <p className="text-slate-700 text-base font-medium leading-relaxed">
            كل يوم تأخير = فرصة ضائعة. الشركات الكبرى في السعودية تملأ مناصبها الآن.
            <strong className="text-red-600"> لا تترك مستقبلك المهني للحظ.</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   4. SOLUTION SECTION
══════════════════════════════════════════════════════════════════════════ */
function SolutionSection() {
  const steps = [
    {
      num: "١",
      title: "ارفع سيرتك الذاتية",
      desc: "PDF أو Word — في ثوانٍ يبدأ الذكاء الاصطناعي بالعمل.",
    },
    {
      num: "٢",
      title: "احصل على تقرير شامل",
      desc: "+٥٠ معيار ATS، نقاط قوة وضعف مفصّلة، ومقارنة بالوظيفة المستهدفة.",
    },
    {
      num: "٣",
      title: "حسّن تلقائياً",
      desc: "اقبل اقتراحات التحسين بنقرة واحدة. يُعيد JobAI كتابة سيرتك لتخترق الـ ATS.",
    },
    {
      num: "٤",
      title: "قدّم بثقة",
      desc: "Cover Letter مخصصة، تدريب على المقابلة، وتقديم ذكي مباشرة للوظيفة.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <SectionLabel>الحل الذكي</SectionLabel>
          <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
            JobAI يحوّل سيرتك الضعيفة
            <br />
            <span className="text-brand-600">إلى آلة حصول على مقابلات</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            أربع خطوات. أقل من ٥ دقائق. نتائج تراها على المدى القريب.
          </p>
        </div>

        <div className="relative">
          {/* Connector line */}
          <div
            aria-hidden
            className="absolute right-[2.75rem] top-10 bottom-10 w-0.5 bg-brand-100 hidden md:block"
          />

          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={i} className="relative flex gap-6 items-start">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white font-black text-lg shadow-lg shadow-brand-200">
                  {s.num}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-black text-slate-900 text-xl mb-2">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex h-14 items-center gap-3 rounded-2xl bg-brand-600 px-12 text-base font-black text-white shadow-xl shadow-brand-200 transition hover:bg-brand-700 hover:-translate-y-0.5"
          >
            ابدأ الخطوة الأولى مجاناً
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   5. FEATURES SECTION (Benefits-first)
══════════════════════════════════════════════════════════════════════════ */
function FeaturesSection() {
  const features = [
    {
      icon: <BarChart3 className="h-7 w-7" />,
      color: "text-brand-600",
      bg: "bg-brand-50",
      title: "تحليل ATS بـ +٥٠ معياراً",
      benefit: "اعرف بالضبط لماذا تُرفض سيرتك — وكيف تُصلحها.",
      bullets: ["تقرير نقاط شامل", "مقارنة بالوظيفة المستهدفة", "أولويات التحسين واضحة"],
    },
    {
      icon: <Zap className="h-7 w-7" />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      title: "إعادة كتابة ذكية بالـ AI",
      benefit: "سيرتك تتحول في ثوانٍ لتنافس كبار المتقدمين.",
      bullets: ["اقتراحات جاهزة للتطبيق", "يحافظ على أسلوبك الشخصي", "يضخّ الكلمات المفتاحية الصحيحة"],
    },
    {
      icon: <MessageSquare className="h-7 w-7" />,
      color: "text-green-600",
      bg: "bg-green-50",
      title: "Cover Letter مخصصة",
      benefit: "رسالة تقديم احترافية لكل وظيفة في ٣٠ ثانية.",
      bullets: ["مخصصة لكل جهة عمل", "عربي وإنجليزي", "نبرة احترافية مقنعة"],
    },
    {
      icon: <Brain className="h-7 w-7" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      title: "مقابلة تدريبية بالـ AI",
      benefit: "تدرّب على أسئلة مخصصة لوظيفتك قبل المقابلة الحقيقية.",
      bullets: ["أسئلة بناءً على CV والوظيفة", "تقييم فوري للإجابات", "تحسين مستمر"],
    },
    {
      icon: <Target className="h-7 w-7" />,
      color: "text-teal",
      bg: "bg-teal-light/40",
      title: "مطابقة الوظائف الذكية",
      benefit: "اكتشف الوظائف التي تناسبك قبل أن تبحث عنها.",
      bullets: ["تصفية بالمهارات والخبرة", "درجة توافق واضحة", "تنبيه بالفرص الجديدة"],
    },
    {
      icon: <Send className="h-7 w-7" />,
      color: "text-rose-600",
      bg: "bg-rose-50",
      title: "تقديم ذكي للوظائف",
      benefit: "وفّر ساعات في التقديم — أرسل لعشرات الشركات دفعة واحدة.",
      bullets: ["رسائل WhatsApp مخصصة", "تتبع حالة التقديم", "إدارة متكاملة للطلبات"],
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <SectionLabel>ما يميزنا</SectionLabel>
          <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
            ليست مجرد أدوات — بل
            <span className="text-brand-600"> نتائج ملموسة</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
            كل ميزة صُممت لهدف واحد: تحويل بحثك عن عمل من معاناة إلى منهجية ناجحة.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-lg hover:border-brand-100 hover:-translate-y-1"
            >
              <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${f.bg} ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">{f.title}</h3>
              <p className="text-brand-700 font-bold text-sm mb-4">{f.benefit}</p>
              <ul className="space-y-2">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   6. WHY NOW SECTION
══════════════════════════════════════════════════════════════════════════ */
function WhyNowSection() {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <Badge className="mb-5 border-brand-700 bg-brand-800/50 text-brand-200">
            <Rocket className="h-4 w-4" />
            لماذا الآن تحديداً؟
          </Badge>
          <h2 className="text-4xl font-black md:text-5xl">
            سوق العمل السعودي يتغيّر
            <br />
            <span className="text-brand-300">بسرعة لم نشهدها من قبل</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <TrendingUp className="h-8 w-8 text-brand-300" />,
              title: "رؤية ٢٠٣٠ تفتح آلاف الوظائف",
              desc: "مشاريع التحول الوطني تخلق فرصاً غير مسبوقة في كل القطاعات — لكنها تذهب للأكثر استعداداً.",
            },
            {
              icon: <BarChart3 className="h-8 w-8 text-amber-400" />,
              title: "٩٥٪ من الشركات تعتمد ATS",
              desc: "الشركات الكبرى في السعودية اعتمدت أنظمة ATS بشكل كامل. CV غير محسّن = رفض فوري.",
            },
            {
              icon: <Clock className="h-8 w-8 text-teal" />,
              title: "الوقت عامل حاسم",
              desc: "الوظائف المميزة تُملأ في أيام. كل يوم تأخير في تحسين سيرتك هو فرصة تضيع.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl bg-white/5 border border-white/10 p-7 backdrop-blur-sm">
              <div className="mb-4">{item.icon}</div>
              <h3 className="font-black text-white text-lg mb-3">{item.title}</h3>
              <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-300 text-lg mb-6">
            المنافسون يحسّنون سيرهم الذاتية بالذكاء الاصطناعي الآن.
            <strong className="text-white"> هل ستبقى متأخراً؟</strong>
          </p>
          <Link
            href="/register"
            className="inline-flex h-14 items-center gap-3 rounded-2xl bg-brand-500 px-12 font-black text-white shadow-xl transition hover:bg-brand-400 hover:-translate-y-0.5"
          >
            ابدأ قبل منافسيك — مجاناً
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   7. RESULTS SECTION
══════════════════════════════════════════════════════════════════════════ */
function ResultsSection() {
  const results = [
    { num: "٨٧٪", label: "زيادة في معدل الوصول لمرحلة المقابلة", color: "text-brand-600" },
    { num: "٣×", label: "أسرع في الحصول على عروض العمل", color: "text-teal" },
    { num: "٩٢٪", label: "من المستخدمين يوصون بالمنصة لأصدقائهم", color: "text-amber-600" },
    { num: "١٤ يوم", label: "متوسط الوقت من التسجيل لأول مقابلة", color: "text-purple-600" },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-16">
          <SectionLabel>نتائج حقيقية</SectionLabel>
          <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
            أرقام لا نخترعها —
            <span className="text-brand-600"> مستخدمونا يثبتونها</span>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {results.map((r) => (
            <div key={r.label} className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
              <div className={`text-5xl font-black mb-3 ${r.color}`}>{r.num}</div>
              <p className="text-slate-600 text-sm leading-relaxed">{r.label}</p>
            </div>
          ))}
        </div>

        {/* Case study snapshot */}
        <div className="mt-10 rounded-3xl bg-brand-50 border border-brand-100 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4">قصة نجاح حقيقية</Badge>
              <h3 className="text-2xl font-black text-slate-900 mb-4">
                من "لم يردّوا عليّ" إلى ٣ عروض عمل في ٣ أسابيع
              </h3>
              <p className="text-slate-600 leading-relaxed">
                أحمد، مهندس برمجيات بخبرة ٥ سنوات، كان يتقدم لشهور دون ردود. بعد تحليل JobAI وإعادة كتابة سيرته،
                وصل لمرحلة المقابلة في NEOM، STC Pay، وأرامكو في نفس الأسبوع.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: "معدل فتح الطلب قبل", val: "٨٪", after: "٦٧٪", good: true },
                { label: "ردود أولية خلال ٧ أيام", val: "٠", after: "٤ ردود", good: true },
                { label: "وقت إعداد CV", val: "٣ أيام", after: "٣٥ دقيقة", good: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between bg-white rounded-xl p-4 border border-brand-100">
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-3 text-sm font-bold">
                    <span className="text-slate-400 line-through">{item.val}</span>
                    <ArrowLeft className="h-4 w-4 text-teal rotate-180" />
                    <span className="text-teal">{item.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   8. TESTIMONIALS
══════════════════════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "سارة الأحمد",
      role: "أخصائية تسويق رقمي",
      city: "الرياض",
      rating: 5,
      text: "كنت أعاني من رفض الـ ATS المتكرر لأكثر من ٦ أشهر. بعد تحليل JobAI وتطبيق التوصيات، وصلت لمرحلة المقابلة في ٣ شركات كبرى خلال ٣ أسابيع فقط. لا أصدق الفرق!",
      highlight: "٣ مقابلات في ٣ أسابيع",
    },
    {
      name: "محمد القحطاني",
      role: "مدير مشاريع تقنية",
      city: "جدة",
      rating: 5,
      text: "أداة تحليل الـ ATS كشفت لي مشاكل في سيرتي لم أكن أتوقعها أبداً. والأفضل أن التقرير يشرح بالضبط كيف تحل كل مشكلة — ليس مجرد قائمة انتقادات.",
      highlight: "نقاط ATS من ٣٤ لـ ٨٩",
    },
    {
      name: "نورة الزهراني",
      role: "محاسبة قانونية معتمدة",
      city: "الدمام",
      rating: 5,
      text: "ميزة المقابلة التدريبية بالـ AI غيّرت حياتي. كنت أخاف من المقابلات — الآن أدخلها بثقة كاملة. حصلت على وظيفتي الحالية في أرامكو بعد تدريب أسبوعين.",
      highlight: "قُبلت في أرامكو",
    },
    {
      name: "عبدالله الشمري",
      role: "مهندس ميكاترونكس",
      city: "الرياض",
      rating: 5,
      text: "خاصية إنشاء Cover Letter مخصصة وفّرت عليّ ساعات طويلة. كل رسالة تبدو وكأنني كتبتها يدوياً وبعناية فائقة، لكنها تستغرق ٣٠ ثانية.",
      highlight: "وفّر ١٠+ ساعات أسبوعياً",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <SectionLabel>يقولون عنا</SectionLabel>
          <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
            لسنا من يقول إننا الأفضل —
            <br />
            <span className="text-brand-600">مستخدمونا يفعلون ذلك</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-1 text-amber-400 mb-4">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>

              {/* Highlight badge */}
              <div className="inline-block rounded-full bg-teal-light/60 px-3 py-1 text-xs font-black text-teal mb-4">
                ✓ {t.highlight}
              </div>

              {/* Quote */}
              <blockquote className="text-slate-700 leading-relaxed mb-6 text-base">
                "{t.text}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white font-black text-base">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-black text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">
                    {t.role} — {t.city}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   9. PRICING
══════════════════════════════════════════════════════════════════════════ */
function PricingSection() {
  const plans = [
    {
      name: "مجاني",
      price: "٠",
      period: "",
      tag: null,
      desc: "جرّب القوة قبل أي التزام",
      features: [
        "تحليل CV واحد",
        "تقرير ATS أساسي",
        "اقتراح تحسينات جزئية",
        "Cover Letter واحدة",
      ],
      disabled: ["مقابلة تدريبية بالـ AI", "مطابقة الوظائف الذكية", "تقديم ذكي"],
      cta: "ابدأ مجاناً",
      href: "/register",
      highlight: false,
    },
    {
      name: "احترافي",
      price: "٤٩",
      period: "/ شهر",
      tag: "الأكثر شعبية",
      desc: "لمن يأخذ مسيرته المهنية بجدية",
      features: [
        "تحليل CV غير محدود",
        "تقرير ATS متقدم (٥٠+ معيار)",
        "إعادة كتابة كاملة بالـ AI",
        "Cover Letter غير محدودة",
        "مقابلة تدريبية بالـ AI",
        "مطابقة وظائف ذكية",
        "دعم أولوي",
      ],
      disabled: [],
      cta: "ابدأ ٧ أيام مجاناً",
      href: "/register",
      highlight: true,
    },
    {
      name: "مميز",
      price: "٩٩",
      period: "/ شهر",
      tag: "للمحترفين الطموحين",
      desc: "كل شيء + تقديم ذكي جماعي",
      features: [
        "كل مزايا الاحترافي",
        "تقديم ذكي جماعي للوظائف",
        "رسائل WhatsApp مخصصة",
        "تتبع حالة التقديمات",
        "تقارير أداء أسبوعية",
        "مدير حساب شخصي",
        "وصول مبكر للميزات الجديدة",
      ],
      disabled: [],
      cta: "احصل على الأفضل",
      href: "/register",
      highlight: false,
    },
  ];

  return (
    <section className="py-24 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <SectionLabel>الأسعار</SectionLabel>
          <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
            استثمار بسيط —
            <span className="text-brand-600"> عائد على المسيرة المهنية</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            كوب قهوة يومياً أو وظيفة تغيّر حياتك؟ أنت تختار.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 border ${
                plan.highlight
                  ? "bg-brand-600 border-brand-600 text-white shadow-2xl shadow-brand-200 scale-105"
                  : "bg-white border-slate-100 shadow-sm"
              }`}
            >
              {plan.tag && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span
                    className={`rounded-full px-4 py-1.5 text-xs font-black shadow ${
                      plan.highlight
                        ? "bg-amber-400 text-amber-900"
                        : "bg-brand-600 text-white"
                    }`}
                  >
                    {plan.tag}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-black text-xl mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-brand-200" : "text-slate-500"}`}>
                  {plan.desc}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    {plan.price}
                  </span>
                  {plan.price !== "٠" && (
                    <span className={`text-sm ${plan.highlight ? "text-brand-200" : "text-slate-500"}`}>
                      ريال{plan.period}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${plan.highlight ? "text-green-300" : "text-teal"}`} />
                    <span className={plan.highlight ? "text-brand-100" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
                {plan.disabled.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
                    <span className="text-slate-300 line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full rounded-2xl py-3.5 text-center font-black text-base transition hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-white text-brand-600 shadow-lg hover:bg-brand-50"
                    : "bg-brand-600 text-white hover:bg-brand-700"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
          جميع الخطط تشمل: لا رسوم خفية • إلغاء في أي وقت • دعم عبر WhatsApp
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   10. FAQ
══════════════════════════════════════════════════════════════════════════ */
function FaqSection() {
  const faqs = [
    {
      q: "هل أنظمة ATS فعلاً تستبعد السير الذاتية تلقائياً؟",
      a: "نعم، تشير الدراسات إلى أن ٧٥٪ من السير الذاتية تُرفض من قِبل أنظمة ATS قبل أن يراها أي مسؤول توظيف. هذه الأنظمة تبحث عن كلمات مفتاحية محددة وهيكلة معينة — وJobAI يضمن أن سيرتك تمرّ منها.",
    },
    {
      q: "هل المنصة مناسبة لمن هو في بداية مسيرته؟",
      a: "بالتأكيد. JobAI مصمم للجميع — من الخريج الجديد إلى المدير التنفيذي. الذكاء الاصطناعي يتكيف مع مستوى خبرتك ويقدم توصيات مناسبة لكل مرحلة.",
    },
    {
      q: "هل بياناتي وسيرتي الذاتية آمنة؟",
      a: "نعم تماماً. نستخدم تشفيراً بمعايير بنكية (AES-256). بياناتك لن تُشارك مع أي جهة خارجية أبداً. أنت تملك بياناتك وتستطيع حذفها متى شئت.",
    },
    {
      q: "كيف يختلف JobAI عن قوالب السيرة الذاتية العادية؟",
      a: "القوالب تعطيك شكلاً جميلاً — JobAI يعطيك شكلاً جميلاً وذكياً في نفس الوقت. نحن نحلل محتوى سيرتك، ونضخ الكلمات المفتاحية الصحيحة، ونتأكد من أنها تعمل مع أنظمة ATS — ليس فقط تبدو جيدة.",
    },
    {
      q: "هل يدعم اللغة العربية بشكل كامل؟",
      a: "نعم، JobAI هو أول منصة من نوعها تعالج اللغة العربية تقنياً بنفس كفاءة الإنجليزية. يمكنك تحليل وتحسين سيرتك بالعربية أو الإنجليزية أو حتى بالاثنتين معاً.",
    },
    {
      q: "ما الذي يحدث بعد انتهاء الفترة المجانية؟",
      a: "لن يُطلب منك أي معلومات دفع لبدء الفترة المجانية. إذا أردت الاستمرار بعدها، تختار الخطة المناسبة. لا رسوم مخفية، لا اشتراك تلقائي.",
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <SectionLabel>أسئلة شائعة</SectionLabel>
          <h2 className="text-4xl font-black text-slate-900">
            كل ما تريد معرفته
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between gap-4 p-6 text-right"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-bold text-slate-900 text-base">{faq.q}</span>
                {open === i ? (
                  <ChevronUp className="h-5 w-5 text-brand-600 shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-6 pb-6 text-slate-600 leading-relaxed text-sm border-t border-slate-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   11. FINAL CTA
══════════════════════════════════════════════════════════════════════════ */
function FinalCta() {
  return (
    <section className="py-10 px-6 pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 px-8 py-20 text-center text-white shadow-2xl shadow-brand-200">
          {/* Decorative elements */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-teal/20 blur-3xl" />
          </div>

          <div className="relative z-10">
            <Badge className="mb-6 border-white/20 bg-white/10 text-white">
              <Award className="h-4 w-4" />
              ابدأ اليوم — الوظيفة تنتظرك
            </Badge>

            <h2 className="text-4xl font-black md:text-6xl mb-4">
              وظيفة أحلامك ليست حظاً.
              <br />
              <span className="text-brand-200">إنها استراتيجية.</span>
            </h2>

            <p className="mx-auto max-w-xl text-brand-100 text-lg mb-10 leading-relaxed">
              أكثر من ٥٠٠٠ محترف سعودي وخليجي حوّلوا مسيرتهم المهنية مع JobAI.
              أنت التالي — والبداية مجانية تماماً.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex h-16 items-center gap-3 rounded-2xl bg-white px-12 text-lg font-black text-brand-700 shadow-2xl transition hover:scale-105 hover:bg-brand-50 active:scale-95"
              >
                حلّل سيرتك مجاناً الآن
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </Link>
            </div>

            {/* Final micro trust */}
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-brand-200 text-sm">
              {["لا بطاقة ائتمانية", "إلغاء في أي وقت", "نتائج خلال ٣٠ ثانية"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
