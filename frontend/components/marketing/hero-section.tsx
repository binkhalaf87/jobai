"use client";

import Link from "next/link";
import { Upload, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { FadeUp } from "./fade-up";

type HeroT = {
  badge: string;
  sub: string;
  cta1: string;
  cta2: string;
  trust: readonly string[];
};

function ATSCard({ isAr }: { isAr: boolean }) {
  const kws = [
    { matched: true, ar: "إدارة المشاريع", en: "Project Management" },
    { matched: true, ar: "Python", en: "Python" },
    { matched: false, ar: "Agile", en: "Agile" },
    { matched: false, ar: "AWS", en: "AWS" },
  ];

  return (
    <div className="relative w-full max-w-[340px]">
      <div className="absolute inset-0 -z-10 rounded-3xl bg-brand-500/20 blur-3xl" />
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className={`mb-4 flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}>
          <span className="h-2 w-2 rounded-full bg-teal" />
          <span className="text-xs font-semibold text-slate-400">
            {isAr ? "تحليل ATS" : "ATS Analysis"}
          </span>
        </div>

        {/* Score ring */}
        <div className="mb-4 flex flex-col items-center">
          <div className="relative mb-2 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-teal bg-teal/10">
            <span className="text-3xl font-black text-white">{isAr ? "٨٧" : "87"}</span>
          </div>
          <span className="text-xs text-slate-400">
            {isAr ? "درجة التوافق" : "Match Score"}
          </span>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          {kws.map((kw) => (
            <div
              key={kw.en}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                kw.matched ? "bg-teal/10 text-teal" : "bg-red-500/10 text-red-400"
              } ${isAr ? "flex-row-reverse" : ""}`}
            >
              <span className="shrink-0">{kw.matched ? "✓" : "✗"}</span>
              <span className="text-slate-300">{isAr ? kw.ar : kw.en}</span>
              {!kw.matched && (
                <span className={`${isAr ? "mr-auto" : "ml-auto"} text-red-400`}>
                  {isAr ? "مفقود" : "missing"}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* AI ready */}
        <div className={`mt-4 flex items-center gap-2 rounded-xl bg-brand-500/15 px-3 py-2 ${isAr ? "flex-row-reverse" : ""}`}>
          <span className="text-xs">✨</span>
          <span className="text-xs font-medium text-brand-300">
            {isAr ? "جاهز للتحسين بالذكاء الاصطناعي" : "AI Enhancement ready"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ t, isAr }: { t: HeroT; isAr: boolean }) {
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-slate-950 pb-24 pt-16 md:pb-32 md:pt-24">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand-600/10 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
          {/* Copy */}
          <FadeUp>
            <div className={isAr ? "text-right" : "text-left"}>
              {/* Badge */}
              <div
                className={`mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-2 ${
                  isAr ? "flex-row-reverse" : ""
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                <span className="text-xs font-semibold tracking-wide text-brand-300">
                  {t.badge}
                </span>
              </div>

              {/* H1 */}
              <h1 className="mb-6 text-5xl font-black leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
                {isAr ? (
                  <>
                    وظيفتك القادمة{" "}
                    <span className="bg-gradient-to-r from-teal to-brand-400 bg-clip-text text-transparent">
                      تبدأ هنا.
                    </span>
                  </>
                ) : (
                  <>
                    Your Next Job{" "}
                    <span className="bg-gradient-to-r from-teal to-brand-400 bg-clip-text text-transparent">
                      Starts Here.
                    </span>
                  </>
                )}
              </h1>

              {/* Sub */}
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-slate-400 md:text-xl">
                {t.sub}
              </p>

              {/* CTAs */}
              <div
                className={`mb-8 flex flex-wrap gap-3 ${
                  isAr ? "flex-row-reverse justify-end" : ""
                }`}
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-teal px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20 active:scale-[0.98]"
                >
                  <Upload className="h-4 w-4" />
                  {t.cta1}
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                >
                  {t.cta2}
                  <Arrow className="h-4 w-4" />
                </a>
              </div>

              {/* Trust row */}
              <div
                className={`flex flex-wrap gap-5 ${
                  isAr ? "flex-row-reverse justify-end" : ""
                }`}
              >
                {t.trust.map((item) => (
                  <div
                    key={item}
                    className={`flex items-center gap-1.5 ${
                      isAr ? "flex-row-reverse" : ""
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" />
                    <span className="text-xs text-slate-500">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Visual */}
          <FadeUp delay={200}>
            <div
              className={`flex justify-center ${
                isAr ? "lg:justify-start" : "lg:justify-end"
              }`}
            >
              <ATSCard isAr={isAr} />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
