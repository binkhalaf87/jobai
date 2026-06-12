import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Clock, ArrowRight, ArrowLeft } from "lucide-react";

import { BLOG_POSTS, getPostBySlug } from "@/lib/blog-posts";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return {};
  const locale = await getLocale();
  const isAr = locale === "ar";
  return {
    title: `${isAr ? post.title : post.titleEn} — JobAI24`,
    description: isAr ? post.excerpt : post.excerptEn,
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const locale = await getLocale();
  const isAr = locale === "ar";
  const BackArrow = isAr ? ArrowRight : ArrowLeft;
  const body = isAr ? post.body : post.bodyEn;

  return (
    <article className="bg-white py-16 md:py-24" dir={isAr ? "rtl" : "ltr"}>
      <div className={`mx-auto max-w-3xl px-6 ${isAr ? "text-right" : ""}`}>
        {/* Back link */}
        <Link
          href="/blog"
          className={`mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 ${
            isAr ? "flex-row-reverse" : ""
          }`}
        >
          <BackArrow className="h-4 w-4" />
          {isAr ? "كل المقالات" : "All articles"}
        </Link>

        {/* Cover */}
        <div className={`mb-8 h-52 rounded-2xl bg-gradient-to-br md:h-64 ${post.coverGradient}`} />

        {/* Meta */}
        <div className={`mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-400 ${isAr ? "flex-row-reverse" : ""}`}>
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-bold text-brand-600">
            {isAr ? post.category : post.categoryEn}
          </span>
          <span className={`flex items-center gap-1 ${isAr ? "flex-row-reverse" : ""}`}>
            <Clock className="h-3 w-3" />
            {post.readingMinutes} {isAr ? "دقائق قراءة" : "min read"}
          </span>
          <span>
            {isAr ? post.author : post.authorEn} ·{" "}
            {new Date(post.date).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-8 text-3xl font-black leading-tight tracking-tight text-slate-950 md:text-4xl">
          {isAr ? post.title : post.titleEn}
        </h1>

        {/* Body */}
        <div className="space-y-5">
          {body.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-slate-600 md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center">
          <h2 className="text-xl font-black text-slate-950">
            {isAr ? "جاهز لتحسين سيرتك الذاتية؟" : "Ready to improve your resume?"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {isAr
              ? "ارفع سيرتك واحصل على تحليل ATS كامل خلال ٣٠ ثانية."
              : "Upload your resume and get a full ATS analysis in 30 seconds."}
          </p>
          <Link
            href="/register"
            className="mt-5 inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-700"
          >
            {isAr ? "ابدأ مجاناً" : "Start Free"}
          </Link>
        </div>
      </div>
    </article>
  );
}
