import Link from "next/link";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Clock } from "lucide-react";

import { SectionBadge } from "@/components/marketing/section-badge";
import { getLatestPosts } from "@/lib/blog-posts";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: isAr ? "المدونة — JobAI24" : "Blog — JobAI24",
    description: isAr
      ? "مقالات ونصائح عملية عن السيرة الذاتية وأنظمة ATS وسوق العمل في السعودية والخليج."
      : "Practical articles on resumes, ATS systems, and the Saudi and Gulf job market.",
  };
}

export default async function BlogIndexPage() {
  const locale = await getLocale();
  const isAr = locale === "ar";
  const posts = getLatestPosts();

  const t = {
    badge: isAr ? "المدونة" : "Blog",
    h1: isAr ? "نصائح ومقالات لمسيرتك المهنية" : "Career advice & articles",
    sub: isAr
      ? "كل ما تحتاج معرفته عن السيرة الذاتية وأنظمة ATS وسوق العمل في السعودية والخليج"
      : "Everything you need to know about resumes, ATS systems, and the Gulf job market",
    minRead: isAr ? "دقائق قراءة" : "min read",
  };

  return (
    <section className="bg-slate-50 py-20 md:py-28" dir={isAr ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 text-center">
          <SectionBadge>{t.badge}</SectionBadge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            {t.h1}
          </h1>
          <p className="mt-3 text-lg text-slate-500">{t.sub}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:shadow-panel"
            >
              {/* Cover */}
              <div className={`h-40 bg-gradient-to-br ${post.coverGradient}`} />

              <div className={`flex flex-1 flex-col p-6 ${isAr ? "text-right" : ""}`}>
                <div className={`mb-3 flex items-center gap-3 text-xs text-slate-400 ${isAr ? "flex-row-reverse" : ""}`}>
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-bold text-brand-600">
                    {isAr ? post.category : post.categoryEn}
                  </span>
                  <span className={`flex items-center gap-1 ${isAr ? "flex-row-reverse" : ""}`}>
                    <Clock className="h-3 w-3" />
                    {isAr ? `${post.readingMinutes} ${t.minRead}` : `${post.readingMinutes} ${t.minRead}`}
                  </span>
                </div>

                <h2 className="mb-2 font-bold leading-snug text-slate-950 transition-colors group-hover:text-brand-600">
                  {isAr ? post.title : post.titleEn}
                </h2>
                <p className="flex-1 text-sm leading-relaxed text-slate-500">
                  {isAr ? post.excerpt : post.excerptEn}
                </p>

                <p className="mt-4 text-xs text-slate-400">
                  {isAr ? post.author : post.authorEn} ·{" "}
                  {new Date(post.date).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
