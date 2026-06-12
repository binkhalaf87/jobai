import Link from "next/link";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";

import { SectionBadge } from "./section-badge";
import { getLatestPosts } from "@/lib/blog-posts";

export function BlogTeaserSection({ isAr }: { isAr: boolean }) {
  const posts = getLatestPosts(3);
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const t = {
    badge: isAr ? "من المدونة" : "From the Blog",
    h2: isAr ? "نصائح تقرّبك من وظيفتك" : "Advice that gets you hired",
    sub: isAr
      ? "أحدث المقالات عن السيرة الذاتية وسوق العمل"
      : "The latest on resumes and the job market",
    all: isAr ? "كل المقالات" : "All articles",
    minRead: isAr ? "دقائق قراءة" : "min read",
  };

  return (
    <section className="bg-slate-50 py-20 md:py-28" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <SectionBadge>{t.badge}</SectionBadge>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {t.h2}
          </h2>
          <p className="mt-3 text-lg text-slate-500">{t.sub}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-panel"
            >
              <div className={`h-32 bg-gradient-to-br ${post.coverGradient}`} />
              <div className={`flex flex-1 flex-col p-5 ${isAr ? "text-right" : ""}`}>
                <div className={`mb-2 flex items-center gap-3 text-xs text-slate-400 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-bold text-brand-600">
                    {isAr ? post.category : post.categoryEn}
                  </span>
                  <span className={`flex items-center gap-1 ${isAr ? "flex-row-reverse" : ""}`}>
                    <Clock className="h-3 w-3" />
                    {post.readingMinutes} {t.minRead}
                  </span>
                </div>
                <h3 className="text-sm font-bold leading-snug text-slate-950 transition-colors group-hover:text-brand-600">
                  {isAr ? post.title : post.titleEn}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className={`inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 ${
              isAr ? "flex-row-reverse" : ""
            }`}
          >
            {t.all}
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
