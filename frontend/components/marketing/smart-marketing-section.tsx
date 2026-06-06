"use client";

import Link from "next/link";
import { Send, Rocket, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { FadeUp } from "./fade-up";

type SmartT = {
  badge: string;
  h2: string;
  sub: string;
  desc: string;
  steps: readonly { num: string; title: string }[];
  benefits: readonly string[];
  cta: string;
  ctaNote: string;
};

function CampaignCard({ isAr }: { isAr: boolean }) {
  const stats = isAr
    ? [
        { num: "٢٤٧", label: "وصلنا لهم" },
        { num: "٣٨", label: "اهتموا" },
        { num: "٧", label: "ردّوا" },
      ]
    : [
        { num: "247", label: "Reached" },
        { num: "38", label: "Engaged" },
        { num: "7", label: "Replied" },
      ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className={`mb-5 flex items-center gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/20">
          <Send className="h-5 w-5 text-teal" />
        </div>
        <div className={isAr ? "text-right" : ""}>
          <p className="text-sm font-bold text-white">
            {isAr ? "حملة نشطة" : "Campaign Active"}
          </p>
          <p className="text-xs text-slate-400">
            {isAr ? "مهندس برمجيات · الرياض" : "Software Engineer · Riyadh"}
          </p>
        </div>
        <span
          className={`${isAr ? "mr-auto" : "ml-auto"} flex items-center gap-1.5 rounded-full bg-teal/15 px-2.5 py-1 text-xs font-bold text-teal`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal" />
          {isAr ? "مباشر" : "Live"}
        </span>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white/5 p-3 text-center">
            <p className="text-2xl font-black text-white">{s.num}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div className="space-y-2">
        {(isAr
          ? ["أرسل JobAI24 ملفك لـ ٥ شركات جديدة", "شركة تقنية في الرياض فتحت سيرتك", "ردّ مدير توظيف من دبي"]
          : ["JobAI24 sent your profile to 5 new companies", "A tech company in Riyadh opened your CV", "A hiring manager from Dubai replied"]
        ).map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300 ${
              isAr ? "flex-row-reverse" : ""
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                i === 0 ? "bg-brand-400" : i === 1 ? "bg-amber-400" : "bg-teal"
              }`}
            />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SmartMarketingSection({ t, isAr }: { t: SmartT; isAr: boolean }) {
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-brand-900 py-20 md:py-28">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand-600/15 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div
          className={`flex flex-col gap-14 lg:flex-row lg:items-center ${
            isAr ? "lg:flex-row-reverse" : ""
          }`}
        >
          {/* Content */}
          <FadeUp className="flex-1">
            <div className={isAr ? "text-right" : ""}>
              {/* Badge */}
              <div
                className={`mb-5 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 ${
                  isAr ? "flex-row-reverse" : ""
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-teal">
                  {t.badge}
                </span>
              </div>

              <h2 className="mb-3 text-3xl font-black tracking-tight text-white md:text-4xl lg:text-5xl">
                {t.h2}
              </h2>
              <p className="mb-2 text-lg font-semibold text-brand-300">{t.sub}</p>
              <p className="mb-8 max-w-lg text-base leading-relaxed text-slate-400">{t.desc}</p>

              {/* Steps */}
              <ol className="mb-8 space-y-3.5">
                {t.steps.map((step, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-4 ${isAr ? "flex-row-reverse" : ""}`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal/15 text-sm font-black text-teal">
                      {step.num}
                    </span>
                    <span className="text-sm font-medium text-slate-300">{step.title}</span>
                  </li>
                ))}
              </ol>

              {/* Benefits */}
              <ul className="mb-8 space-y-2">
                {t.benefits.map((b, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : ""}`}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" />
                    <span className="text-sm text-slate-300">{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-teal px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-teal/90 hover:shadow-lg hover:shadow-teal/20"
              >
                <Rocket className="h-4 w-4" />
                {t.cta}
                <Arrow className="h-4 w-4" />
              </Link>
              <p className="mt-2 text-xs text-slate-500">{t.ctaNote}</p>
            </div>
          </FadeUp>

          {/* Campaign card */}
          <FadeUp delay={180} className="w-full max-w-sm lg:w-80 lg:shrink-0">
            <CampaignCard isAr={isAr} />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
