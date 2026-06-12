/** Static blog content — replace stubs with full articles or a CMS later. */

export type BlogPost = {
  slug: string;
  title: string;
  titleEn: string;
  excerpt: string;
  excerptEn: string;
  date: string; // ISO
  author: string;
  authorEn: string;
  category: string;
  categoryEn: string;
  readingMinutes: number;
  /** Tailwind gradient classes used as the cover visual until real images exist */
  coverGradient: string;
  /** Paragraphs of body content (plain text, rendered as <p>) */
  body: string[];
  bodyEn: string[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "beat-the-ats-filter",
    title: "كيف تتجاوز فلتر ATS وتصل سيرتك لمكتب التوظيف",
    titleEn: "How to Beat the ATS Filter and Get Your Resume to a Recruiter",
    excerpt:
      "أكثر من ٧٥٪ من السير الذاتية تُرفض آلياً قبل أن يراها أي إنسان. تعرف على كيفية عمل أنظمة تتبع المتقدمين وكيف تجعل سيرتك تتجاوزها.",
    excerptEn:
      "Over 75% of resumes are rejected automatically before a human ever sees them. Learn how ATS systems work and how to get past them.",
    date: "2026-06-01",
    author: "فريق JobAI24",
    authorEn: "JobAI24 Team",
    category: "السيرة الذاتية",
    categoryEn: "Resumes",
    readingMinutes: 6,
    coverGradient: "from-brand-600 to-brand-900",
    body: [
      "عندما تتقدم لوظيفة في شركة متوسطة أو كبيرة في السعودية أو الخليج، فإن أول من يقرأ سيرتك الذاتية ليس إنساناً — بل نظام تتبع المتقدمين (ATS). هذه الأنظمة تفرز مئات الطلبات وتستبعد تلقائياً كل سيرة لا تطابق معايير الوظيفة.",
      "في هذا المقال نشرح كيف تقرأ أنظمة ATS سيرتك، وما الأخطاء الشائعة في التنسيق والكلمات المفتاحية التي تتسبب في الرفض الآلي، وكيف تستخدم تحليل JobAI24 لمعرفة درجة توافق سيرتك قبل التقديم.",
      "(محتوى المقال الكامل قيد الإعداد — تابعنا قريباً.)",
    ],
    bodyEn: [
      "When you apply to a mid-size or large company in Saudi Arabia or the Gulf, the first reader of your resume is not a human — it's an Applicant Tracking System (ATS). These systems screen hundreds of applications and automatically discard any resume that doesn't match the role's criteria.",
      "In this article we explain how ATS systems parse your resume, the common formatting and keyword mistakes that trigger automatic rejection, and how to use JobAI24's analysis to know your match score before you apply.",
      "(Full article coming soon — stay tuned.)",
    ],
  },
  {
    slug: "top-keywords-saudi-job-market-2025",
    title: "أكثر الكلمات المفتاحية طلباً في سوق العمل السعودي 2025",
    titleEn: "The Most In-Demand Keywords in the Saudi Job Market 2025",
    excerpt:
      "ما الكلمات التي تبحث عنها أنظمة التوظيف وأصحاب العمل في السعودية هذا العام؟ قائمة عملية حسب المجال الوظيفي.",
    excerptEn:
      "Which keywords are recruiters and ATS systems in Saudi Arabia searching for this year? A practical list by job field.",
    date: "2026-05-20",
    author: "فريق JobAI24",
    authorEn: "JobAI24 Team",
    category: "سوق العمل",
    categoryEn: "Job Market",
    readingMinutes: 8,
    coverGradient: "from-teal to-brand-800",
    body: [
      "تتغير متطلبات سوق العمل السعودي بسرعة مع رؤية ٢٠٣٠ والتحول الرقمي. الكلمات المفتاحية التي كانت كافية قبل سنتين لم تعد تميّزك اليوم.",
      "جمعنا في هذا المقال أكثر الكلمات المفتاحية وروداً في إعلانات الوظائف السعودية لعام ٢٠٢٥ حسب المجال: التقنية، التسويق، المالية، الموارد البشرية، وحديثي التخرج — مع أمثلة على كيفية دمجها في سيرتك بشكل طبيعي.",
      "(محتوى المقال الكامل قيد الإعداد — تابعنا قريباً.)",
    ],
    bodyEn: [
      "The Saudi job market is changing fast with Vision 2030 and digital transformation. Keywords that were enough two years ago no longer set you apart today.",
      "In this article we compiled the most frequent keywords in Saudi job postings for 2025 by field: tech, marketing, finance, HR, and fresh graduates — with examples of how to weave them into your resume naturally.",
      "(Full article coming soon — stay tuned.)",
    ],
  },
  {
    slug: "arabic-vs-english-resume",
    title: "الفرق بين السيرة الذاتية العربية والإنجليزية: متى تستخدم كلاً منهما؟",
    titleEn: "Arabic vs. English Resumes: When to Use Each",
    excerpt:
      "هل تقدّم سيرتك بالعربية أم بالإنجليزية؟ القرار يعتمد على الشركة والقطاع والوظيفة — إليك دليل عملي للاختيار الصحيح.",
    excerptEn:
      "Should you submit your resume in Arabic or English? It depends on the company, sector, and role — here's a practical guide.",
    date: "2026-05-05",
    author: "فريق JobAI24",
    authorEn: "JobAI24 Team",
    category: "السيرة الذاتية",
    categoryEn: "Resumes",
    readingMinutes: 5,
    coverGradient: "from-amber-500 to-brand-700",
    body: [
      "من أكثر الأسئلة التي تصلنا: هل أرسل سيرتي بالعربية أم بالإنجليزية؟ الإجابة ليست واحدة — فهي تعتمد على القطاع (حكومي أم خاص)، وجنسية الشركة، ولغة إعلان الوظيفة نفسه.",
      "في هذا الدليل نشرح متى تكون السيرة العربية أقوى، ومتى تكون الإنجليزية ضرورية، ولماذا ننصح أحياناً بتجهيز النسختين معاً — وكيف يساعدك JobAI24 في إنشاء وتحسين سيرتك باللغتين.",
      "(محتوى المقال الكامل قيد الإعداد — تابعنا قريباً.)",
    ],
    bodyEn: [
      "One of the most common questions we get: should I send my resume in Arabic or English? There's no single answer — it depends on the sector (public vs. private), the company's origin, and the language of the job posting itself.",
      "In this guide we explain when an Arabic resume is stronger, when English is essential, why we sometimes recommend preparing both versions — and how JobAI24 helps you create and enhance your resume in both languages.",
      "(Full article coming soon — stay tuned.)",
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Posts sorted newest first */
export function getLatestPosts(count?: number): BlogPost[] {
  const sorted = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return count ? sorted.slice(0, count) : sorted;
}
