"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "next-intl";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Sparkles, FileText, Target, Zap,
  BarChart3, ShieldCheck, Users2, XCircle, TrendingUp, Clock, Star,
  ChevronDown, ChevronUp, MessageSquare, Send, Brain, Award, Rocket,
  Building2, Globe, Lock, Filter, UserCheck, MapPin,
} from "lucide-react";

/* ─── content types ──────────────────────────────────────────────────── */
type PainItem = { color: string; title: string; desc: string };
type StepItem = { num: string; title: string; desc: string };
type FeatureItem = { title: string; benefit: string; bullets: readonly string[]; color: string };
type BenefitItem = { title: string; desc: string };
type StatRow = { num: string; label: string };
type MetricRow = { num: string; label: string; color: string };
type CaseRow = { label: string; before: string; after: string };
type TestimonialItem = { name: string; role: string; city: string; highlight: string; text: string };
type PlanItem = { name: string; price: string; period: string; tag: string | null; desc: string; features: readonly string[]; disabled: readonly string[]; cta: string; highlight: boolean };
type FaqItem = { q: string; a: string };
type PreviewTab = { id: string; label: string; desc: string };

type Content = {
  hero: {
    badge: string;
    toggle: { jobseeker: string; recruiter: string };
    jobseeker: { h1: readonly [string, string]; sub: string; cta: string; ctaAlt: string };
    recruiter: { h1: readonly [string, string]; sub: string; cta: string; ctaAlt: string };
    trust: readonly string[];
    rating: string;
    ratingNote: string;
  };
  stats: readonly StatRow[];
  pain: {
    sectionLabel: string; headline: string; sub: string;
    tabs: { jobseeker: string; recruiter: string };
    jobseeker: readonly PainItem[];
    recruiter: readonly PainItem[];
  };
  solution: {
    sectionLabel: string;
    jobseeker: { headline: string; headlineAccent: string; steps: readonly StepItem[] };
    recruiter: { headline: string; headlineAccent: string; steps: readonly StepItem[] };
  };
  features: { sectionLabel: string; headline: string; headlineAccent: string; sub: string; items: readonly FeatureItem[] };
  preview: {
    sectionLabel: string; headline: string; sub: string;
    tabs: readonly PreviewTab[];
    ats: { title: string; score: string; scoreLabel: string; matchLabel: string; matches: readonly string[]; missingLabel: string; missing: readonly string[]; tipsLabel: string; tips: readonly string[] };
    letter: { title: string; styles: readonly string[]; preview: string; sendLabel: string; variantsLabel: string };
    interview: { title: string; meta: string; qLabel: string; question: string; evalLabel: string; evalScore: string; evalTags: readonly string[] };
  };
  recruiterBenefits: {
    sectionLabel: string; headline: string; headlineAccent: string; sub: string;
    items: readonly { stat: string; statLabel: string; title: string; desc: string }[];
  };
  candidateBenefits: { sectionLabel: string; headline: string; headlineAccent: string; sub: string; items: readonly BenefitItem[] };
  saudi: { sectionLabel: string; headline: string; headlineAccent: string; sub: string; items: readonly BenefitItem[] };
  trust: { sectionLabel: string; headline: string; headlineAccent: string; sub: string; items: readonly BenefitItem[] };
  results: {
    sectionLabel: string; headline: string; headlineAccent: string;
    metrics: readonly MetricRow[];
    caseStudy: { badge: string; headline: string; story: string; rows: readonly CaseRow[] };
  };
  testimonials: { sectionLabel: string; headline: string; headlineAccent: string; items: readonly TestimonialItem[] };
  pricing: {
    sectionLabel: string; headline: string; headlineAccent: string; sub: string;
    tabs: { individual: string; enterprise: string };
    individual: readonly PlanItem[];
    enterprise: { headline: string; sub: string; features: readonly string[]; cta: string; ctaNote: string };
    note: string;
    currencyLabel: string;
  };
  faq: { sectionLabel: string; headline: string; items: readonly FaqItem[] };
  finalCta: { badge: string; headline: string; headlineAccent: string; sub: string; cta: string; trust: readonly string[] };
};

/* ─── bilingual content ──────────────────────────────────────────────── */
const AR: Content = {
  hero: {
    badge: "منصة التوظيف الذكي رقم ١ في الخليج العربي",
    toggle: { jobseeker: "باحث عن عمل", recruiter: "مسؤول توظيف / HR" },
    jobseeker: {
      h1: ["كم مرة أرسلت سيرتك", "ولم يردّ عليك أحد؟"],
      sub: "JobAI يحلل سيرتك في ٣٠ ثانية، يكشف نقاط الضعف الخفية، ويعيد كتابتها لتخترق أنظمة الـ ATS — ويضاعف فرصك في الحصول على مقابلة.",
      cta: "حلّل سيرتك مجاناً — في ٣٠ ثانية",
      ctaAlt: "لديّ حساب — سجّل الدخول",
    },
    recruiter: {
      h1: ["صفّ مئة مرشح", "في وقت مراجعة خمسة فقط."],
      sub: "JobAI يحلل السير الذاتية تلقائياً، يرتّب المرشحين بدقة، وينشئ أسئلة مقابلة مخصصة لكل دور — فريقك يركّز على القرار، لا المراجعة.",
      cta: "ابدأ تجربة مجانية للشركات",
      ctaAlt: "تعرّف على خطط المؤسسات",
    },
    trust: ["بدون بطاقة ائتمانية", "نتائج في ٣٠ ثانية", "+٥٠٠٠ محترف وشركة"],
    rating: "٤.٩/٥",
    ratingNote: "آراء +٥٠٠ مستخدم",
  },
  stats: [
    { num: "+٥٠٠٠", label: "محترف وشركة يستخدمون المنصة" },
    { num: "٩٢٪", label: "يصلون لمرحلة المقابلة" },
    { num: "٣٠ ث", label: "متوسط وقت التحليل الكامل" },
    { num: "+٥٠", label: "معيار تقييم دقيق للـ ATS" },
  ],
  pain: {
    sectionLabel: "المشكلة الحقيقية",
    headline: "لماذا تُرفض ٧٥٪ من السير الذاتية قبل أن يراها بشر؟",
    sub: "المشكلة ليست في مهاراتك — المشكلة في طريقة تقديمها لأنظمة التوظيف الحديثة.",
    tabs: { jobseeker: "للباحثين عن عمل", recruiter: "لمسؤولي التوظيف" },
    jobseeker: [
      { color: "red", title: "رفض أوتوماتيكي صامت", desc: "أنظمة ATS ترفض سيرتك قبل أن تراها أي عين بشرية. ٧٥٪ من الطلبات تُحذف لأسباب تقنية يمكن إصلاحها." },
      { color: "amber", title: "لا تعرف أين الخلل", desc: "سيرتك تبدو رائعة في عيونك، لكنك لا تعلم لماذا تُرفض — الكلمات المفتاحية الناقصة؟ هيكل الصفحات؟ التنسيق؟" },
      { color: "purple", title: "منافسة غير متكافئة", desc: "منافسوك يستخدمون الذكاء الاصطناعي لتحسين سيرهم في دقائق. التقديم اليدوي التقليدي لم يعد كافياً في سوق اليوم." },
      { color: "slate", title: "رسائل تقديم باردة مكررة", desc: "رسالة تقديم واحدة لكل الوظائف لا تُحدث أثراً. لكن كتابة رسالة مخصصة لكل وظيفة يستغرق ساعات ثمينة." },
    ],
    recruiter: [
      { color: "blue", title: "غرق في المراجعة اليدوية", desc: "٨٠٪ من وقت فريق التوظيف يُهدر في قراءة سير غير مناسبة. وقت فريقك يساوي أكثر بكثير من ذلك." },
      { color: "orange", title: "الكفاءات المخفية لا تظهر", desc: "المرشح المثالي قد يكون مدفوناً في مكدّس الطلبات. بدون فرز ذكي، تفوتك كفاءات عالية ذات قيمة حقيقية." },
      { color: "red", title: "مقابلات مع غير المؤهلين", desc: "بدون تصفية دقيقة، يضيع وقت فريقك في مقابلات لمن لا يستوفي المتطلبات الفعلية للوظيفة." },
      { color: "green", title: "قرارات توظيف بلا بيانات", desc: "التقييم الذاتي يفتح الباب للتحيز غير الواعي. الذكاء الاصطناعي يُقيّم بمعايير موضوعية ومتسقة في كل مرة." },
    ],
  },
  solution: {
    sectionLabel: "كيف يعمل JobAI",
    jobseeker: {
      headline: "أربع خطوات. أقل من خمس دقائق.",
      headlineAccent: "نتائج تراها على المدى القريب.",
      steps: [
        { num: "١", title: "ارفع سيرتك الذاتية", desc: "PDF أو Word — يستخرج JobAI كل بياناتك ومؤهلاتك تلقائياً في ثوانٍ." },
        { num: "٢", title: "احصل على تقرير ATS شامل", desc: "+٥٠ معيار تقييم، تحديد الكلمات المفتاحية الناقصة، ومقارنة بالوظيفة المستهدفة." },
        { num: "٣", title: "حسّن بنقرة واحدة", desc: "اقبل اقتراحات إعادة الكتابة الذكية. يُضخّ الكلمات المفتاحية الصحيحة مع الحفاظ على أسلوبك." },
        { num: "٤", title: "قدّم بثقة واحترافية", desc: "Cover Letter مخصصة، تدريب تفاعلي على المقابلة، وإرسال ذكي مباشرة لفرق التوظيف." },
      ],
    },
    recruiter: {
      headline: "من مراجعة يدوية مُضنية إلى",
      headlineAccent: "توظيف مدفوع بالبيانات.",
      steps: [
        { num: "١", title: "ارفع سير المرشحين دفعةً واحدة", desc: "ارفع عشرات السير دفعة واحدة. JobAI يحلّلها ويستخرج البيانات والمهارات تلقائياً." },
        { num: "٢", title: "الذكاء الاصطناعي يُرتّب ويُصنّف", desc: "كل مرشح يحصل على درجة توافق دقيقة مع الوظيفة. قائمة مرتّبة بمعايير موضوعية ومتسقة." },
        { num: "٣", title: "الاختيار التلقائي الذكي", desc: "حدّد الحد الأدنى للدرجة وJobAI يُنقل المرشحين المؤهلين للمرحلة التالية فوراً." },
        { num: "٤", title: "مقابلات مخصصة بالذكاء الاصطناعي", desc: "أنشئ أسئلة مقابلة لكل مرشح بناءً على سيرته والوظيفة. أرسل دعوة بنقرة واحدة." },
      ],
    },
  },
  features: {
    sectionLabel: "ما يميزنا",
    headline: "ليست مجرد أدوات —",
    headlineAccent: "بل نتائج ملموسة",
    sub: "كل ميزة صُممت بهدف واحد: تحويل بحثك عن عمل من معاناة إلى منهجية ذكية.",
    items: [
      { title: "تحليل ATS بـ +٥٠ معياراً", benefit: "اعرف بالضبط لماذا تُرفض سيرتك — وكيف تُصلحها.", bullets: ["تقرير نقاط شامل ومفصّل", "مقارنة بالوظيفة المستهدفة", "أولويات التحسين واضحة"], color: "brand" },
      { title: "إعادة كتابة ذكية بالـ AI", benefit: "سيرتك تتحول في ثوانٍ لتنافس كبار المتقدمين.", bullets: ["اقتراحات جاهزة بنقرة واحدة", "يحافظ على أسلوبك الشخصي", "يُضخّ الكلمات المفتاحية الصحيحة"], color: "amber" },
      { title: "Cover Letter مخصصة لكل وظيفة", benefit: "ثلاثة أساليب: رسمي، إبداعي، أو مختصر — في ٣٠ ثانية.", bullets: ["مخصصة لكل جهة عمل", "عربي وإنجليزي", "إرسال مباشر عبر Gmail"], color: "green" },
      { title: "تدريب تفاعلي على المقابلة", benefit: "تدرّب على أسئلة مخصصة لوظيفتك قبل المقابلة الحقيقية.", bullets: ["أسئلة من CV والوظيفة المستهدفة", "تقييم فوري مع ملاحظات مفصّلة", "دعم عربي وإنجليزي"], color: "purple" },
      { title: "مطابقة الوظائف بالذكاء الاصطناعي", benefit: "اكتشف الوظائف الأنسب لك من +٢٥ منصة توظيف.", bullets: ["درجة توافق واضحة لكل وظيفة", "تحليل الكلمات المفتاحية المطابقة", "بحث موحّد من عشرات المصادر"], color: "teal" },
      { title: "إرسال ذكي جماعي", benefit: "وفّر ساعات في التقديم — أرسل لعشرات الشركات دفعة واحدة.", bullets: ["تكامل مع Gmail OAuth", "قوالب WhatsApp مخصصة", "تتبع كامل لحالة التقديم"], color: "rose" },
    ],
  },
  preview: {
    sectionLabel: "معاينة المنتج",
    headline: "شاهد JobAI في العمل",
    sub: "اكتشف كيف تبدو تجربة الاستخدام الفعلية داخل المنصة.",
    tabs: [
      { id: "ats", label: "تحليل الـ ATS", desc: "تقرير +٥٠ معياراً يكشف نقاط الضعف الخفية" },
      { id: "letter", label: "Cover Letter", desc: "ثلاثة أساليب مخصصة لكل وظيفة في ثوانٍ" },
      { id: "interview", label: "تدريب المقابلة", desc: "أسئلة مخصصة لدورك مع تقييم فوري مفصّل" },
    ],
    ats: {
      title: "تقرير تحليل الـ ATS",
      score: "٨٥", scoreLabel: "درجة التوافق",
      matchLabel: "الكلمات المطابقة",
      matches: ["إدارة المشاريع", "تطوير البرمجيات", "العمل الجماعي", "Python"],
      missingLabel: "الكلمات الناقصة",
      missing: ["Agile / رشاقة", "AWS", "REST APIs", "DevOps"],
      tipsLabel: "أولى التوصيات",
      tips: ["أضف قسم المهارات التقنية", "اذكر منهجيات Agile بالتفصيل", "أضف نتائج قابلة للقياس"],
    },
    letter: {
      title: "رسالة التقديم",
      styles: ["رسمي ✓", "إبداعي", "مختصر"],
      preview: "عزيزي مدير التوظيف،\n\nأتقدم بكامل الحماس لشغل منصب مطوّر برمجيات أول في شركتكم الرائدة. خلال مسيرتي المهنية التي امتدت خمس سنوات، قدت فرقاً تقنية وأطلقت منتجات خدمت ملايين المستخدمين في المنطقة...",
      sendLabel: "أرسل عبر Gmail",
      variantsLabel: "٣ نسخ جاهزة",
    },
    interview: {
      title: "تدريب المقابلة",
      meta: "مدير مشاريع · متقدم · عربي",
      qLabel: "السؤال ٣ من ٨",
      question: "صف تجربتك في إدارة فريق في ظروف ضاغطة وكيف حافظت على الإنتاجية؟",
      evalLabel: "تقييم إجابتك",
      evalScore: "٨٨",
      evalTags: ["وضوح ممتاز", "ثقة عالية", "تحسين: أضف أمثلة بأرقام"],
    },
  },
  recruiterBenefits: {
    sectionLabel: "لمسؤولي التوظيف والـ HR",
    headline: "وفّر ٨٠٪ من وقت فريقك",
    headlineAccent: "واحصل على توظيف أكثر دقة",
    sub: "JobAI يُقدّم لفرق HR وأخصائيي اكتساب المواهب أدوات الذكاء الاصطناعي التي تحوّل التوظيف من ورشة عمل مُنهِكة إلى عملية مدفوعة بالبيانات.",
    items: [
      { stat: "+٨٠٪", statLabel: "توفير في وقت المراجعة", title: "فرز جماعي تلقائي", desc: "ارفع مئات السير وتلقَّ قائمة مرتّبة بالمرشحين الأنسب خلال دقائق، لا أيام." },
      { stat: "٣×", statLabel: "أسرع في ملء الشواغر", title: "اختيار ذكي تلقائي", desc: "حدّد الحد الأدنى لدرجة التوافق وJobAI يُحوّل المؤهلين للمرحلة التالية تلقائياً." },
      { stat: "٩٢٪", statLabel: "دقة في تقييم المرشحين", title: "مقابلات مخصصة بالـ AI", desc: "لكل مرشح، أسئلة مقابلة مبنية على سيرته والوظيفة المحددة. أرسل دعوة بنقرة." },
      { stat: "١٠٠٪", statLabel: "شفافية في القرار", title: "تقارير وتحليلات كاملة", desc: "لوحة تحليلات تشمل معدلات التحويل، متوسط درجات التوافق، وإحصاءات خط الأنابيب." },
    ],
  },
  candidateBenefits: {
    sectionLabel: "للباحثين عن عمل",
    headline: "من الرفض المتكرر إلى",
    headlineAccent: "٣ عروض عمل في أسبوعين",
    sub: "JobAI يُعيد تشكيل تجربة البحث عن عمل — من ضربة حظ إلى منهجية علمية قائمة على البيانات والذكاء الاصطناعي.",
    items: [
      { title: "اعرف نقاط ضعفك بالضبط", desc: "تقرير ATS شامل يشرح لك بالتحديد ما الذي يجعل سيرتك تُرفض — ليس مجرد انتقادات، بل خطوات قابلة للتنفيذ فوراً." },
      { title: "تحسين في دقائق لا أيام", desc: "اقبل اقتراحات الذكاء الاصطناعي بنقرة واحدة. سيرتك تصل لمستوى المنافسة الاحترافية في دقائق لا أيام." },
      { title: "تدرّب على مقابلاتك مسبقاً", desc: "أسئلة مخصصة لوظيفتك ومستوى خبرتك، مع تقييم فوري وتفصيلي لكل إجابة بعربي أو إنجليزي." },
      { title: "قدّم لعشرات الشركات في نقرة", desc: "أنشئ Cover Letter مخصصة لكل وظيفة وأرسلها مباشرة عبر Gmail — تتبّع حالة كل تقديم في لوحة واحدة." },
    ],
  },
  saudi: {
    sectionLabel: "صُمّم لسوق العمل الخليجي",
    headline: "الذكاء الاصطناعي الأول",
    headlineAccent: "المصمّم أصالةً للعربية والخليج",
    sub: "JobAI ليس منصة غربية مترجمة. هو منصة ولدت في منطقتنا، تفهم سوقنا، وتتكلم لغتنا.",
    items: [
      { title: "عربي أولاً وأصالةً", desc: "معالجة اللغة العربية بنفس كفاءة الإنجليزية. تحليل وتحسين السيرة عربياً أو إنجليزياً أو بالاثنتين." },
      { title: "رؤية ٢٠٣٠ في صميم المنصة", desc: "مُوائم مع متطلبات سوق العمل السعودي في إطار التحول الوطني — من التوطين إلى رفع الكفاءة الوظيفية." },
      { title: "دفع محلي آمن عبر Paymob", desc: "شراكة مع Paymob لدعم بطاقات مدى، فيزا، ماستركارد، وبوابات الدفع الخليجية." },
      { title: "تغطية الخليج الكاملة", desc: "المنصة متاحة للباحثين عن عمل والشركات في السعودية والإمارات والكويت والبحرين وقطر وعُمان." },
    ],
  },
  trust: {
    sectionLabel: "الأمان والموثوقية",
    headline: "بياناتك محمية",
    headlineAccent: "بأعلى معايير الأمن",
    sub: "نتعامل مع سيرتك الذاتية كبيانات حساسة — لذلك نبني أنظمتنا بمعايير بنكية صارمة.",
    items: [
      { title: "تشفير AES-256", desc: "كل بياناتك وملفاتك مُشفّرة بمعيار AES-256 — نفس التشفير الذي تستخدمه البنوك العالمية." },
      { title: "بدون مشاركة بيانات أبداً", desc: "بياناتك ملكك الخاص. لا نشاركها مع أي جهة خارجية لأي غرض — لا إعلانات، لا بيع." },
      { title: "JWT وتأمين الجلسات", desc: "نظام مصادقة متقدم مع تجديد تلقائي للرموز ورصد لأي دخول مشبوه من خارج الجلسة." },
      { title: "حذف كامل في أي وقت", desc: "تستطيع حذف حسابك وكل بياناتك نهائياً متى شئت — لا بيروقراطية، لا تعقيد." },
    ],
  },
  results: {
    sectionLabel: "نتائج حقيقية",
    headline: "أرقام يثبتها",
    headlineAccent: "مستخدمونا",
    metrics: [
      { num: "٨٧٪", label: "زيادة في معدل الوصول لمرحلة المقابلة", color: "text-brand-600" },
      { num: "٣×", label: "أسرع في الحصول على عروض العمل", color: "text-teal" },
      { num: "٩٢٪", label: "من المستخدمين يوصون بالمنصة", color: "text-amber-600" },
      { num: "١٤ يوم", label: "متوسط الوقت من التسجيل لأول مقابلة", color: "text-purple-600" },
    ],
    caseStudy: {
      badge: "قصة نجاح حقيقية",
      headline: "من ٦ أشهر صمت إلى ٣ عروض عمل في ٣ أسابيع",
      story: "أحمد، مهندس برمجيات بخبرة ٥ سنوات، كان يتقدم لشهور دون ردود. بعد تحليل JobAI وإعادة كتابة سيرته، وصل لمرحلة المقابلة في NEOM وSTC Pay وأرامكو في نفس الأسبوع.",
      rows: [
        { label: "معدل فتح الطلب", before: "٨٪", after: "٦٧٪" },
        { label: "ردود خلال ٧ أيام", before: "٠", after: "٤ ردود" },
        { label: "وقت إعداد CV", before: "٣ أيام", after: "٣٥ دقيقة" },
      ],
    },
  },
  testimonials: {
    sectionLabel: "يقولون عنا",
    headline: "لسنا من يقول إننا الأفضل —",
    headlineAccent: "مستخدمونا يفعلون ذلك",
    items: [
      { name: "سارة الأحمد", role: "أخصائية تسويق رقمي", city: "الرياض", highlight: "٣ مقابلات في ٣ أسابيع", text: "كنت أعاني من رفض الـ ATS المتكرر لأكثر من ٦ أشهر. بعد تحليل JobAI وتطبيق التوصيات، وصلت لمرحلة المقابلة في ٣ شركات كبرى خلال ٣ أسابيع. لا أصدق الفرق!" },
      { name: "محمد القحطاني", role: "مدير مشاريع تقنية", city: "جدة", highlight: "نقاط ATS من ٣٤ لـ ٨٩", text: "تحليل الـ ATS كشف لي مشاكل لم أكن أتوقعها. الأفضل أن التقرير يشرح بالضبط كيف تحل كل مشكلة — ليس مجرد قائمة انتقادات." },
      { name: "نورة الزهراني", role: "محاسبة قانونية معتمدة", city: "الدمام", highlight: "قُبلت في أرامكو", text: "ميزة المقابلة التدريبية بالـ AI غيّرت حياتي. كنت أخاف من المقابلات — الآن أدخلها بثقة كاملة. حصلت على وظيفتي الحالية في أرامكو بعد أسبوعين من التدريب." },
      { name: "عبدالله الشمري", role: "مهندس ميكاترونكس", city: "الرياض", highlight: "وفّر +١٠ ساعات أسبوعياً", text: "خاصية إنشاء Cover Letter مخصصة وفّرت عليّ ساعات طويلة. كل رسالة تبدو وكأنني كتبتها يدوياً بعناية فائقة، لكنها تستغرق ٣٠ ثانية." },
    ],
  },
  pricing: {
    sectionLabel: "الأسعار",
    headline: "استثمار بسيط.",
    headlineAccent: "عائد على مسيرتك المهنية.",
    sub: "كوب قهوة يومياً أو وظيفة تغيّر حياتك؟ أنت تختار.",
    tabs: { individual: "للأفراد", enterprise: "للشركات" },
    currencyLabel: "ريال",
    individual: [
      { name: "مجاني", price: "٠", period: "", tag: null, desc: "جرّب القوة قبل أي التزام", features: ["تحليل CV واحد", "تقرير ATS أساسي", "اقتراحات تحسين جزئية", "Cover Letter واحدة"], disabled: ["مقابلة تدريبية بالـ AI", "مطابقة الوظائف الذكية", "إرسال ذكي جماعي"], cta: "ابدأ مجاناً", highlight: false },
      { name: "احترافي", price: "٤٩", period: "/ شهر", tag: "الأكثر شعبية", desc: "لمن يأخذ مسيرته المهنية بجدية", features: ["تحليل CV غير محدود", "تقرير ATS متقدم (+٥٠ معيار)", "إعادة كتابة كاملة بالـ AI", "Cover Letter غير محدودة", "مقابلة تدريبية بالـ AI", "مطابقة الوظائف الذكية", "دعم أولوي"], disabled: [], cta: "ابدأ ٧ أيام مجاناً", highlight: true },
      { name: "مميز", price: "٩٩", period: "/ شهر", tag: "للمحترفين الطموحين", desc: "كل شيء + إرسال ذكي جماعي", features: ["كل مزايا الاحترافي", "إرسال ذكي جماعي للوظائف", "قوالب WhatsApp مخصصة", "تتبع كامل للتقديمات", "تقارير أداء أسبوعية", "مدير حساب شخصي", "وصول مبكر للميزات"], disabled: [], cta: "احصل على الأفضل", highlight: false },
    ],
    enterprise: {
      headline: "خطط مؤسسية مخصصة",
      sub: "للشركات والجهات الحكومية التي تحتاج توظيفاً بالجملة مع دعم احترافي متكامل.",
      features: ["رفع جماعي لسير المرشحين (مئات الملفات)", "AI Screening وترتيب المرشحين تلقائياً", "إنشاء أسئلة مقابلة مخصصة لكل منصب", "الاختيار التلقائي بعتبات درجات قابلة للضبط", "لوحة تحليلات وتقارير مفصّلة", "API قابل للتكامل مع أنظمة HR", "مدير حساب مخصص", "تدريب الفريق والإعداد التقني"],
      cta: "تحدّث مع فريقنا",
      ctaNote: "استجابة خلال ٢٤ ساعة",
    },
    note: "جميع الخطط: بدون رسوم خفية • إلغاء في أي وقت • دعم عبر WhatsApp",
  },
  faq: {
    sectionLabel: "أسئلة شائعة",
    headline: "كل ما تريد معرفته",
    items: [
      { q: "هل أنظمة ATS فعلاً ترفض السير الذاتية تلقائياً؟", a: "نعم. تُشير الدراسات إلى أن ٧٥٪ من السير الذاتية تُحذف بواسطة أنظمة ATS قبل أن يراها مسؤول التوظيف. هذه الأنظمة تبحث عن كلمات مفتاحية محددة وهيكل معين. JobAI يضمن توافق سيرتك مع هذه المعايير بالكامل." },
      { q: "هل المنصة مناسبة لحديثي التخرج؟", a: "بالتأكيد. JobAI صُمّم للجميع — من الخريج الجديد إلى المدير التنفيذي. الذكاء الاصطناعي يتكيف مع مستوى خبرتك ويقدم توصيات مناسبة لكل مرحلة مهنية." },
      { q: "هل بياناتي وسيرتي آمنة؟", a: "نعم تماماً. نستخدم تشفير AES-256 لكل بياناتك. لا نشارك سيرتك أو بياناتك الشخصية مع أي جهة خارجية أبداً. تستطيع حذف كل بياناتك متى شئت." },
      { q: "كيف يختلف JobAI عن قوالب السيرة الذاتية العادية؟", a: "القوالب تُعطيك شكلاً جميلاً. JobAI يُعطيك شكلاً جميلاً + محتوى ذكياً يتوافق تقنياً مع أنظمة ATS. نحن نحلل المحتوى، نضخ الكلمات المفتاحية الصحيحة، ونضمن التوافق التقني الكامل." },
      { q: "هل يدعم اللغة العربية بالكامل؟", a: "نعم. JobAI هو من أوائل المنصات التي تعالج اللغة العربية تقنياً بنفس كفاءة الإنجليزية. تحليل وتحسين السير الذاتية عربياً، إنجليزياً، أو بالاثنتين معاً." },
      { q: "هل تتوفر خطط خاصة للشركات والجهات الحكومية؟", a: "نعم. نقدم حلولاً مؤسسية مخصصة لفرق HR والتوظيف تشمل الفرز الجماعي، التقارير، وتكامل API. تواصل مع فريقنا للحصول على عرض مخصص." },
      { q: "ماذا يحدث بعد انتهاء الفترة المجانية؟", a: "لا يُطلب منك أي معلومات دفع للبدء مجاناً. إذا أردت الاستمرار، تختار الخطة المناسبة. لا رسوم مخفية، لا اشتراك تلقائي بدون موافقتك الصريحة." },
      { q: "هل يعمل مع الوظائف في الإمارات والكويت وبقية الخليج؟", a: "نعم. JobAI يدعم الباحثين عن عمل والشركات في كل دول الخليج: السعودية، الإمارات، الكويت، البحرين، قطر، وعُمان." },
    ],
  },
  finalCta: {
    badge: "ابدأ اليوم — الوظيفة تنتظرك",
    headline: "وظيفة أحلامك ليست حظاً.",
    headlineAccent: "إنها استراتيجية.",
    sub: "أكثر من ٥٠٠٠ محترف سعودي وخليجي حوّلوا مسيرتهم المهنية مع JobAI. أنت التالي — والبداية مجانية تماماً.",
    cta: "حلّل سيرتك مجاناً الآن",
    trust: ["بدون بطاقة ائتمانية", "إلغاء في أي وقت", "نتائج خلال ٣٠ ثانية"],
  },
};

const EN: Content = {
  hero: {
    badge: "The #1 AI-Powered Hiring Platform for Saudi Arabia & GCC",
    toggle: { jobseeker: "Job Seeker", recruiter: "HR / Recruiter" },
    jobseeker: {
      h1: ["Your resume is being rejected", "before any human reads it."],
      sub: "JobAI analyzes your resume in 30 seconds, reveals hidden ATS failures, and rewrites it to pass every filter — doubling your chances of landing an interview.",
      cta: "Analyze My Resume — Free in 30 Seconds",
      ctaAlt: "Sign In",
    },
    recruiter: {
      h1: ["Screen 100 candidates", "in the time it takes to read 5."],
      sub: "JobAI auto-ranks applicants, generates tailored interview questions, and frees up 80%+ of your team's review time — so you focus on decisions, not reading.",
      cta: "Start Free Enterprise Trial",
      ctaAlt: "Explore Enterprise Plans",
    },
    trust: ["No credit card required", "Results in 30 seconds", "5,000+ professionals trust us"],
    rating: "4.9/5",
    ratingNote: "500+ verified reviews",
  },
  stats: [
    { num: "5,000+", label: "Professionals & companies on the platform" },
    { num: "92%", label: "Reach the interview stage" },
    { num: "30s", label: "Average full analysis time" },
    { num: "50+", label: "ATS evaluation criteria" },
  ],
  pain: {
    sectionLabel: "The Real Problem",
    headline: "Why 75% of resumes are rejected before a human ever sees them.",
    sub: "The issue isn't your skills — it's how they're presented to modern hiring systems.",
    tabs: { jobseeker: "For Job Seekers", recruiter: "For HR Teams" },
    jobseeker: [
      { color: "red", title: "Silent Auto-Rejection", desc: "ATS systems filter your resume before any recruiter sees it. 75% of applications are eliminated at this stage for fixable technical reasons." },
      { color: "amber", title: "You Don't Know What's Wrong", desc: "Your resume looks great to you — but you don't know why it's rejected. Missing keywords? Wrong structure? Incompatible formatting?" },
      { color: "purple", title: "Unfair Competition", desc: "Your competitors use AI to optimize their resumes in minutes. Manual applications no longer compete in today's market." },
      { color: "slate", title: "Generic Cover Letters", desc: "One letter for every job doesn't cut it. But writing a custom letter for each application takes hours you don't have." },
    ],
    recruiter: [
      { color: "blue", title: "Drowning in Manual Review", desc: "80% of your hiring team's time is spent reading irrelevant resumes. Your team's time is worth far more than that." },
      { color: "orange", title: "Hidden Top Talent Gets Missed", desc: "Your ideal candidate might be buried in the application stack. Without smart screening, high-value talent slips through." },
      { color: "red", title: "Interviews With Wrong Candidates", desc: "Without precise filtering, your team wastes hours interviewing people who don't meet actual job requirements." },
      { color: "green", title: "Gut-Feel Hiring Decisions", desc: "Subjective assessment opens the door to unconscious bias. AI evaluates against consistent, objective criteria every time." },
    ],
  },
  solution: {
    sectionLabel: "How JobAI Works",
    jobseeker: {
      headline: "Four steps. Under five minutes.",
      headlineAccent: "Results you'll see within days.",
      steps: [
        { num: "1", title: "Upload Your Resume", desc: "PDF or Word — JobAI instantly extracts your data, qualifications, and experience." },
        { num: "2", title: "Get a Full ATS Report", desc: "50+ evaluation criteria, missing keyword identification, and comparison against your target job." },
        { num: "3", title: "Improve With One Click", desc: "Accept AI rewrite suggestions instantly. Right keywords injected while preserving your personal voice." },
        { num: "4", title: "Apply With Confidence", desc: "Custom cover letters, AI interview training, and smart bulk sending directly to hiring teams." },
      ],
    },
    recruiter: {
      headline: "From exhausting manual review to",
      headlineAccent: "data-driven hiring.",
      steps: [
        { num: "1", title: "Bulk Upload Candidate Resumes", desc: "Upload dozens at once. JobAI parses, extracts, and structures all candidate data automatically." },
        { num: "2", title: "AI Ranks Every Candidate", desc: "Each candidate receives a precise fit score. A ranked list built on objective, consistent criteria." },
        { num: "3", title: "Auto-Shortlist at Your Threshold", desc: "Set a minimum score and JobAI advances qualified candidates to the next stage automatically." },
        { num: "4", title: "AI-Generated Custom Interviews", desc: "Tailored interview questions per candidate based on their resume and the role. Send invites in one click." },
      ],
    },
  },
  features: {
    sectionLabel: "What Makes Us Different",
    headline: "Not just tools —",
    headlineAccent: "measurable outcomes",
    sub: "Every feature is built for one goal: transforming your job search from guesswork into a systematic, data-driven process.",
    items: [
      { title: "ATS Analysis: 50+ Criteria", benefit: "Know exactly why your resume is rejected — and exactly how to fix it.", bullets: ["Comprehensive scoring breakdown", "Target job comparison", "Prioritized action items"], color: "brand" },
      { title: "AI-Powered Rewrite", benefit: "Your resume transforms in seconds to compete with top candidates.", bullets: ["One-click suggestion acceptance", "Preserves your personal voice", "Injects the right keywords"], color: "amber" },
      { title: "Custom Cover Letters", benefit: "Three tailored styles per job in under 30 seconds.", bullets: ["Customized per employer", "Arabic & English support", "Direct Gmail sending"], color: "green" },
      { title: "AI Interview Training", benefit: "Practice with questions tailored to your exact role before the real thing.", bullets: ["Questions from your CV + job", "Real-time answer evaluation", "Arabic & English support"], color: "purple" },
      { title: "Intelligent Job Matching", benefit: "Discover the right jobs from 25+ boards before you start searching.", bullets: ["Clear fit score per listing", "Matching keyword analysis", "25+ job boards integrated"], color: "teal" },
      { title: "Smart Bulk Applications", benefit: "Save hours — send to dozens of companies at once.", bullets: ["Native Gmail OAuth integration", "Custom WhatsApp templates", "Full application tracking"], color: "rose" },
    ],
  },
  preview: {
    sectionLabel: "Product Preview",
    headline: "See JobAI in Action",
    sub: "A real look at what the platform experience feels like from the inside.",
    tabs: [
      { id: "ats", label: "ATS Analysis", desc: "50+ criteria report revealing every hidden weakness" },
      { id: "letter", label: "Cover Letter", desc: "Three custom styles for each job in seconds" },
      { id: "interview", label: "Interview Training", desc: "Role-specific questions with instant detailed feedback" },
    ],
    ats: {
      title: "ATS Analysis Report",
      score: "85", scoreLabel: "Match Score",
      matchLabel: "Matched Keywords",
      matches: ["Project Management", "Software Development", "Team Leadership", "Python"],
      missingLabel: "Missing Keywords",
      missing: ["Agile Methodology", "AWS", "REST APIs", "DevOps"],
      tipsLabel: "Top Recommendations",
      tips: ["Add a technical skills section", "Detail Agile/Scrum experience", "Add measurable results with numbers"],
    },
    letter: {
      title: "Cover Letter",
      styles: ["Formal ✓", "Creative", "Concise"],
      preview: "Dear Hiring Manager,\n\nI am writing with great enthusiasm to apply for the Senior Software Developer role at your leading organization. Over five years of hands-on experience, I have led engineering teams and shipped products serving millions of users across the region...",
      sendLabel: "Send via Gmail",
      variantsLabel: "3 Variants Ready",
    },
    interview: {
      title: "Interview Training",
      meta: "Project Manager · Senior · English",
      qLabel: "Question 3 of 8",
      question: "Describe your experience managing a team under high-pressure conditions and how you maintained productivity.",
      evalLabel: "Answer Evaluation",
      evalScore: "88",
      evalTags: ["Excellent clarity", "High confidence", "Tip: add quantified examples"],
    },
  },
  recruiterBenefits: {
    sectionLabel: "For HR & Talent Acquisition",
    headline: "Free up 80% of your team's review time",
    headlineAccent: "and hire with higher precision",
    sub: "JobAI gives HR teams and talent acquisition managers the AI tools that transform hiring from a manual burden into a data-driven operation.",
    items: [
      { stat: "80%+", statLabel: "reduction in review time", title: "Automated Bulk Screening", desc: "Upload hundreds of resumes and receive a ranked candidate list within minutes — not days of manual reading." },
      { stat: "3×", statLabel: "faster time to fill", title: "Intelligent Auto-Shortlisting", desc: "Set your minimum fit threshold and JobAI automatically advances qualified candidates to the next stage." },
      { stat: "92%", statLabel: "candidate assessment accuracy", title: "AI Custom Interviews", desc: "For every candidate, bespoke interview questions based on their resume and specific role. Send invite links in one click." },
      { stat: "100%", statLabel: "decision transparency", title: "Analytics & Pipeline Reports", desc: "Full dashboard: conversion rates, average fit scores, pipeline stage stats — everything needed for data-backed decisions." },
    ],
  },
  candidateBenefits: {
    sectionLabel: "For Job Seekers",
    headline: "From repeated rejection to",
    headlineAccent: "3 offers in two weeks.",
    sub: "JobAI transforms job searching from a game of luck into a scientific, data-backed methodology.",
    items: [
      { title: "Know Exactly What's Failing", desc: "A comprehensive ATS report that tells you precisely what's causing rejections — not criticism, but concrete, actionable steps to take immediately." },
      { title: "Improve in Minutes, Not Days", desc: "Accept AI rewrite suggestions with one click. Reach competitive professional quality in minutes, not weekend-long revision sessions." },
      { title: "Practice Before You Interview", desc: "Role-specific questions at your experience level, with immediate, detailed feedback on every single answer." },
      { title: "Apply to Dozens at Once", desc: "Generate custom cover letters for each role and send via Gmail — track every application's status from one unified dashboard." },
    ],
  },
  saudi: {
    sectionLabel: "Built for the Gulf Market",
    headline: "The first AI hiring platform",
    headlineAccent: "built natively for Arabic & GCC",
    sub: "JobAI isn't a Western platform translated. It was born in this region, understands this market, and speaks this language.",
    items: [
      { title: "Arabic-First by Design", desc: "Full Arabic NLP capability matching English processing quality. Analyze and improve resumes in Arabic, English, or both simultaneously." },
      { title: "Aligned with Vision 2030", desc: "Designed for Saudi Arabia's national transformation landscape — supporting Saudization goals and workforce quality elevation." },
      { title: "Local Payment via Paymob", desc: "Paymob integration supporting Mada cards, Visa, Mastercard, and GCC payment gateways. No international payment barriers." },
      { title: "Full GCC Coverage", desc: "Available to job seekers and companies across all Gulf states: Saudi Arabia, UAE, Kuwait, Bahrain, Qatar, and Oman." },
    ],
  },
  trust: {
    sectionLabel: "Security & Reliability",
    headline: "Your data is protected",
    headlineAccent: "to banking-grade standards",
    sub: "Your resume contains sensitive career data. We build our systems to treat it that way.",
    items: [
      { title: "AES-256 Encryption", desc: "All your data and files are encrypted at rest and in transit using AES-256 — the same standard used by leading financial institutions." },
      { title: "Zero Data Sharing", desc: "Your data is yours. We never share it with third parties — not for advertising, not for sale, not for any purpose." },
      { title: "JWT Session Security", desc: "Advanced authentication with automatic token rotation and continuous monitoring for suspicious access patterns." },
      { title: "Complete Data Deletion", desc: "Delete your account and all associated data at any time — permanently, immediately, with no friction or delay." },
    ],
  },
  results: {
    sectionLabel: "Real Outcomes",
    headline: "Numbers backed by",
    headlineAccent: "our users",
    metrics: [
      { num: "87%", label: "increase in interview rate", color: "text-brand-600" },
      { num: "3×", label: "faster at receiving job offers", color: "text-teal" },
      { num: "92%", label: "of users recommend the platform", color: "text-amber-600" },
      { num: "14 days", label: "average time from sign-up to first interview", color: "text-purple-600" },
    ],
    caseStudy: {
      badge: "Real success story",
      headline: "From 6 months of silence to 3 job offers in 3 weeks",
      story: "Ahmed, a software engineer with 5 years of experience, applied for months with no responses. After JobAI's analysis and rewrite, he reached the interview stage at NEOM, STC Pay, and Aramco in the same week.",
      rows: [
        { label: "Application open rate", before: "8%", after: "67%" },
        { label: "Responses within 7 days", before: "0", after: "4 responses" },
        { label: "CV preparation time", before: "3 days", after: "35 minutes" },
      ],
    },
  },
  testimonials: {
    sectionLabel: "What They Say",
    headline: "We don't say we're the best —",
    headlineAccent: "our users do",
    items: [
      { name: "Sara Al-Ahmad", role: "Digital Marketing Specialist", city: "Riyadh", highlight: "3 interviews in 3 weeks", text: "I dealt with repeated ATS rejections for over 6 months. After JobAI's analysis and recommendations, I reached the interview stage at 3 major companies in 3 weeks. The difference is unbelievable." },
      { name: "Mohammed Al-Qahtani", role: "Technical Project Manager", city: "Jeddah", highlight: "ATS score: 34 → 89", text: "The ATS analysis revealed issues I never expected. The best part: the report explains exactly how to fix each problem — not just a list of criticisms." },
      { name: "Nora Al-Zahrani", role: "Certified Public Accountant", city: "Dammam", highlight: "Landed at Aramco", text: "The AI interview training feature changed everything. I used to dread interviews — now I walk in with full confidence. Got my current job at Aramco after two weeks of practice." },
      { name: "Abdullah Al-Shammari", role: "Mechatronics Engineer", city: "Riyadh", highlight: "Saved 10+ hours/week", text: "The custom cover letter feature saved me hours every week. Every letter feels deeply personalized and handcrafted — but takes 30 seconds to generate." },
    ],
  },
  pricing: {
    sectionLabel: "Pricing",
    headline: "A small investment.",
    headlineAccent: "A career-changing return.",
    sub: "One daily coffee — or a job that changes your life? You choose.",
    tabs: { individual: "For Individuals", enterprise: "For Enterprise" },
    currencyLabel: "SAR",
    individual: [
      { name: "Free", price: "0", period: "", tag: null, desc: "Try the power before any commitment", features: ["1 CV analysis", "Basic ATS report", "Partial improvement suggestions", "1 cover letter"], disabled: ["AI Interview Training", "Intelligent Job Matching", "Smart Bulk Applications"], cta: "Start Free", highlight: false },
      { name: "Professional", price: "49", period: "/ month", tag: "Most Popular", desc: "For serious career builders", features: ["Unlimited CV analysis", "Advanced ATS report (50+ criteria)", "Full AI rewrite", "Unlimited cover letters", "AI Interview Training", "Intelligent Job Matching", "Priority support"], disabled: [], cta: "Start 7-Day Free Trial", highlight: true },
      { name: "Premium", price: "99", period: "/ month", tag: "For Ambitious Professionals", desc: "Everything + smart bulk applications", features: ["Everything in Professional", "Smart Bulk Applications", "Custom WhatsApp templates", "Full application tracking", "Weekly performance reports", "Dedicated account manager", "Early access to new features"], disabled: [], cta: "Get the Best", highlight: false },
    ],
    enterprise: {
      headline: "Custom Enterprise Plans",
      sub: "For companies and government organizations that need bulk hiring support with professional-grade tools.",
      features: ["Bulk candidate resume upload (hundreds of files)", "AI Screening & automated candidate ranking", "Custom interview question generation per role", "Auto-shortlisting with configurable score thresholds", "Full analytics dashboard & detailed reports", "HRIS-compatible API integration", "Dedicated account manager", "Team onboarding & training"],
      cta: "Talk to Our Team",
      ctaNote: "Response within 24 hours",
    },
    note: "All plans: No hidden fees • Cancel anytime • WhatsApp support",
  },
  faq: {
    sectionLabel: "FAQ",
    headline: "Everything you need to know",
    items: [
      { q: "Do ATS systems really automatically reject resumes?", a: "Yes. Studies show that 75% of resumes are filtered by ATS systems before any recruiter sees them. These systems scan for specific keywords and structure. JobAI ensures your resume meets these criteria fully." },
      { q: "Is it suitable for recent graduates?", a: "Absolutely. JobAI is designed for everyone — from fresh graduates to senior executives. The AI adapts to your experience level and delivers recommendations relevant to your career stage." },
      { q: "Is my data and resume secure?", a: "Yes. We use AES-256 encryption for all your data. We never share your resume or personal information with any third party. You can delete all your data at any time." },
      { q: "How is JobAI different from resume templates?", a: "Templates give you good design. JobAI gives you great design plus smart content that's technically compatible with ATS systems. We analyze content, inject the right keywords, and ensure full technical compliance." },
      { q: "Is Arabic fully supported?", a: "Yes. JobAI is among the first platforms to process Arabic at the same technical depth as English. Analyze and improve resumes in Arabic, English, or both simultaneously." },
      { q: "Do you offer enterprise plans for companies?", a: "Yes. We offer custom enterprise solutions for HR teams covering bulk screening, analytics, and API integration. Contact our team for a tailored proposal." },
      { q: "What happens after the free period ends?", a: "No payment information is required to start for free. If you want to continue, you choose the right plan. No hidden fees, no automatic subscription without your explicit consent." },
      { q: "Does it work for jobs in UAE, Kuwait, and other Gulf countries?", a: "Yes. JobAI supports job seekers and companies across all Gulf states: Saudi Arabia, UAE, Kuwait, Bahrain, Qatar, and Oman." },
    ],
  },
  finalCta: {
    badge: "Start Today — Your Job Is Waiting",
    headline: "Your dream job isn't luck.",
    headlineAccent: "It's strategy.",
    sub: "Over 5,000 Saudi and Gulf professionals have transformed their careers with JobAI. You're next — and it starts completely free.",
    cta: "Analyze My Resume — Free",
    trust: ["No credit card required", "Cancel anytime", "Results in 30 seconds"],
  },
};

/* ─── helpers ────────────────────────────────────────────────────────── */
function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-xs font-bold tracking-wide text-brand-700 ${className}`}>
      {children}
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-600">{children}</p>;
}

const PAIN_BG: Record<string, string> = {
  red: "bg-red-50 border-red-100", amber: "bg-amber-50 border-amber-100",
  purple: "bg-purple-50 border-purple-100", slate: "bg-slate-100 border-slate-200",
  blue: "bg-blue-50 border-blue-100", orange: "bg-orange-50 border-orange-100",
  green: "bg-emerald-50 border-emerald-100",
};

const FEAT_COLORS: Record<string, string> = {
  brand: "bg-brand-50 text-brand-600", amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600", purple: "bg-purple-50 text-purple-600",
  teal: "bg-teal-light/40 text-teal", rose: "bg-rose-50 text-rose-600",
};

const FEAT_ICONS = [BarChart3, Zap, MessageSquare, Brain, Target, Send];
const SAUDI_ICONS = [Globe, Rocket, ShieldCheck, MapPin];
const TRUST_ICONS = [Lock, ShieldCheck, UserCheck, FileText];

/* ─── main ───────────────────────────────────────────────────────────── */
export default function HomePage() {
  const locale = useLocale();
  const t = locale === "ar" ? AR : EN;
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="overflow-x-hidden">
      <Hero t={t} Arrow={Arrow} isAr={isAr} />
      <StatsBar t={t} />
      <Pain t={t} />
      <Solution t={t} Arrow={Arrow} isAr={isAr} />
      <Features t={t} />
      <SocialProof t={t} />
      <Pricing t={t} />
      <MiniFaq t={t} />
      <FinalCta t={t} Arrow={Arrow} />
    </div>
  );
}

type SectionProps = { t: Content; Arrow: React.ElementType; isAr?: boolean };

/* ─── 1. hero ────────────────────────────────────────────────────────── */
function Hero({ t, Arrow }: SectionProps) {
  const c = t.hero.jobseeker;

  return (
    <section className="relative isolate overflow-hidden bg-white pt-10 pb-20 md:pt-16 md:pb-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 end-0 h-[600px] w-[600px] rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute top-48 -start-20 h-[400px] w-[500px] rounded-full bg-teal-light/70 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6 text-center">
        <div className="mb-6 flex justify-center">
          <Chip><Sparkles className="h-3.5 w-3.5 text-brand-500" />{t.hero.badge}</Chip>
        </div>

        <h1 className="text-[2.6rem] font-black leading-[1.08] tracking-tight text-slate-900 md:text-[5rem]">
          {c.h1[0]}<br /><span className="text-brand-600">{c.h1[1]}</span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-xl leading-relaxed text-slate-500 md:text-2xl">{c.sub}</p>

        <div className="mt-11 flex flex-col items-center gap-4">
          <Link href="/register"
            className="group inline-flex h-16 items-center gap-3 rounded-2xl bg-brand-600 px-12 text-lg font-black text-white shadow-2xl shadow-brand-200/70 transition-all hover:bg-brand-700 hover:-translate-y-1 hover:shadow-brand-300/50">
            {c.cta}<Arrow className="h-5 w-5" />
          </Link>
          <p className="text-sm text-slate-400">{t.hero.trust[2]}</p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-5 text-sm text-slate-500">
          {t.hero.trust.slice(0, 2).map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal" />{item}
            </span>
          ))}
        </div>

        <div className="mt-10 flex justify-center items-center gap-3">
          <div className="flex -space-x-2.5 rtl:-space-x-2.5 rtl:space-x-reverse">
            {["م", "س", "أ", "ف", "ر"].map((l, i) => (
              <div key={i} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-black text-white shadow-sm">{l}</div>
            ))}
          </div>
          <div className="text-start">
            <div className="flex gap-0.5 text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              <strong className="text-slate-700">{t.hero.rating}</strong> — {t.hero.ratingNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── 2. stats bar ───────────────────────────────────────────────────── */
function StatsBar({ t }: { t: Content }) {
  return (
    <div className="border-y border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-7">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {t.stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-brand-600 tabular-nums">{s.num}</div>
              <div className="mt-1 text-xs text-slate-500 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 3. pain ────────────────────────────────────────────────────────── */
function Pain({ t }: { t: Content }) {
  const items = t.pain.jobseeker.slice(0, 3);

  return (
    <section className="py-24 bg-white" id="pain">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <Eyebrow>{t.pain.sectionLabel}</Eyebrow>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl max-w-2xl mx-auto leading-tight">{t.pain.headline}</h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">{t.pain.sub}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((p, i) => (
            <div key={p.title} className={`relative rounded-3xl border p-8 hover:shadow-lg transition-all hover:-translate-y-1 ${PAIN_BG[p.color] ?? "bg-slate-50 border-slate-100"}`}>
              <div className="text-5xl font-black text-slate-100 mb-4 leading-none select-none">{i + 1}</div>
              <h3 className="font-black text-slate-900 text-xl mb-3">{p.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. solution ────────────────────────────────────────────────────── */
function Solution({ t, Arrow, isAr }: SectionProps) {
  const flow = t.solution.jobseeker;

  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white" id="how-it-works">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <Eyebrow>{t.solution.sectionLabel}</Eyebrow>
          <h2 className="text-3xl font-black text-slate-900 md:text-4xl">
            {flow.headline}<br />
            <span className="text-brand-600">{flow.headlineAccent}</span>
          </h2>
        </div>

        <div className="relative">
          <div aria-hidden className={`absolute top-10 bottom-10 w-0.5 bg-brand-100 hidden md:block ${isAr ? "right-[2.75rem]" : "left-[2.75rem]"}`} />
          <div className="space-y-5">
            {flow.steps.map((s, i) => (
              <div key={i} className="relative flex gap-5 items-start">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white font-black text-lg shadow-lg shadow-brand-200/50">{s.num}</div>
                <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="font-black text-slate-900 text-lg mb-1.5">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link href="/register" className="group inline-flex h-14 items-center gap-3 rounded-2xl bg-brand-600 px-10 text-base font-black text-white shadow-xl shadow-brand-200/60 transition hover:bg-brand-700 hover:-translate-y-0.5">
            {t.finalCta.cta}<Arrow className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── 5. features ────────────────────────────────────────────────────── */
function Features({ t }: { t: Content }) {
  return (
    <section className="py-24 bg-white" id="features">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <Eyebrow>{t.features.sectionLabel}</Eyebrow>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
            {t.features.headline}<span className="text-brand-600"> {t.features.headlineAccent}</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">{t.features.sub}</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {t.features.items.slice(0, 4).map((f, i) => {
            const Icon = FEAT_ICONS[i] ?? BarChart3;
            const cls = FEAT_COLORS[f.color] ?? "bg-brand-50 text-brand-600";
            return (
              <div key={f.title} className="group rounded-3xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-brand-100 hover:-translate-y-1">
                <div className={`mb-5 flex h-13 w-13 items-center justify-center rounded-2xl ${cls}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-brand-700 font-semibold text-sm mb-4 leading-snug">{f.benefit}</p>
                <ul className="space-y-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal shrink-0" />{b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 6. social proof ────────────────────────────────────────────────── */
function SocialProof({ t }: { t: Content }) {
  const cs = t.results.caseStudy;
  const testimonials = [t.testimonials.items[0], t.testimonials.items[2]];

  return (
    <section className="py-24 bg-slate-50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center mb-14">
          <Eyebrow>{t.results.sectionLabel}</Eyebrow>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
            {t.testimonials.headline}<br />
            <span className="text-brand-600">{t.testimonials.headlineAccent}</span>
          </h2>
        </div>

        {/* Case study */}
        <div className="rounded-3xl bg-brand-50 border border-brand-100 p-8 md:p-10 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <Chip className="mb-4">{cs.badge}</Chip>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{cs.headline}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{cs.story}</p>
            </div>
            <div className="space-y-3">
              {cs.rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 border border-brand-100">
                  <span className="text-sm text-slate-600">{row.label}</span>
                  <div className="flex items-center gap-2.5 text-sm font-bold">
                    <span className="text-slate-400 line-through">{row.before}</span>
                    <TrendingUp className="h-4 w-4 text-teal" />
                    <span className="text-teal">{row.after}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid gap-5 md:grid-cols-2">
          {testimonials.map((item) => (
            <div key={item.name} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="flex gap-0.5 text-amber-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <span className="inline-block rounded-full bg-teal-light/60 px-3 py-1 text-xs font-black text-teal mb-4">✓ {item.highlight}</span>
              <blockquote className="text-slate-700 leading-relaxed mb-6 text-sm">&ldquo;{item.text}&rdquo;</blockquote>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white font-black text-sm">{item.name.charAt(0)}</div>
                <div>
                  <div className="font-black text-slate-900 text-sm">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.role} — {item.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 7. pricing ─────────────────────────────────────────────────────── */
function Pricing({ t }: { t: Content }) {
  return (
    <section className="py-24 bg-white" id="pricing">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-12">
          <Eyebrow>{t.pricing.sectionLabel}</Eyebrow>
          <h2 className="text-3xl font-black text-slate-900 md:text-5xl">
            {t.pricing.headline}<span className="text-brand-600"> {t.pricing.headlineAccent}</span>
          </h2>
          <p className="mt-4 text-lg text-slate-500">{t.pricing.sub}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {t.pricing.individual.map((plan) => (
            <div key={plan.name} className={`relative rounded-3xl p-8 border transition-all ${plan.highlight ? "bg-brand-600 border-brand-600 text-white shadow-2xl shadow-brand-200 scale-[1.03]" : "bg-white border-slate-100 shadow-sm"}`}>
              {plan.tag && (
                <div className="absolute -top-4 inset-x-0 flex justify-center">
                  <span className={`rounded-full px-4 py-1.5 text-xs font-black shadow ${plan.highlight ? "bg-amber-400 text-amber-900" : "bg-brand-600 text-white"}`}>{plan.tag}</span>
                </div>
              )}
              <div className="mb-6">
                <h3 className={`font-black text-xl mb-1 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.highlight ? "text-brand-200" : "text-slate-500"}`}>{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-5xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                  {plan.price !== "٠" && plan.price !== "0" && (
                    <span className={`text-sm ${plan.highlight ? "text-brand-200" : "text-slate-500"}`}>{t.pricing.currencyLabel}{plan.period}</span>
                  )}
                </div>
              </div>
              <ul className="space-y-2.5 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.highlight ? "text-green-300" : "text-teal"}`} />
                    <span className={plan.highlight ? "text-brand-100" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
                {plan.disabled.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-slate-300" />
                    <span className="text-slate-300 line-through">{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`block w-full rounded-2xl py-3.5 text-center font-black text-sm transition hover:-translate-y-0.5 ${plan.highlight ? "bg-white text-brand-600 shadow-lg hover:bg-brand-50" : "bg-brand-600 text-white hover:bg-brand-700"}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">{t.pricing.note}</p>
        <p className="mt-3 text-center text-xs text-slate-400">
          <Link href="mailto:hello@jobai.sa" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
            {t.pricing.tabs.enterprise} &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ─── 8. mini faq ────────────────────────────────────────────────────── */
function MiniFaq({ t }: { t: Content }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = [t.faq.items[6], t.faq.items[2], t.faq.items[4]];

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-10">
          <Eyebrow>{t.faq.sectionLabel}</Eyebrow>
          <h2 className="text-2xl font-black text-slate-900 md:text-3xl">{t.faq.headline}</h2>
        </div>

        <div className="space-y-2.5">
          {items.map((item, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button className="flex w-full items-center justify-between gap-4 p-5 text-start" onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-bold text-slate-900 text-sm leading-snug">{item.q}</span>
                {open === i ? <ChevronUp className="h-4 w-4 text-brand-600 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
              </button>
              {open === i && (
                <div className="border-t border-slate-50 px-5 pb-5 pt-4 text-sm text-slate-600 leading-relaxed">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 9. final cta ───────────────────────────────────────────────────── */
function FinalCta({ t, Arrow }: SectionProps) {
  return (
    <section className="py-10 px-6 pb-20">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 px-8 py-20 text-center text-white shadow-2xl shadow-brand-300/30">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 end-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 start-0 h-48 w-48 rounded-full bg-teal/20 blur-3xl" />
          </div>

          <div className="relative z-10">
            <Chip className="mb-6 border-white/20 bg-white/10 text-white">
              <Award className="h-3.5 w-3.5" />{t.finalCta.badge}
            </Chip>
            <h2 className="text-4xl font-black md:text-6xl mb-3 leading-tight">
              {t.finalCta.headline}<br />
              <span className="text-brand-200">{t.finalCta.headlineAccent}</span>
            </h2>
            <p className="mx-auto max-w-xl text-brand-100 text-lg mb-10 leading-relaxed">{t.finalCta.sub}</p>

            <Link href="/register" className="group inline-flex h-16 items-center gap-3 rounded-2xl bg-white px-12 text-lg font-black text-brand-700 shadow-2xl transition hover:scale-[1.03] hover:bg-brand-50 active:scale-[0.98]">
              {t.finalCta.cta}<Arrow className="h-5 w-5" />
            </Link>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-brand-200 text-sm">
              {t.finalCta.trust.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal" />{item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}