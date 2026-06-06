"use client";

import Link from "next/link";
import { Upload, CheckCircle2, ArrowRight, ArrowLeft, Rocket } from "lucide-react";
import { FadeUp } from "./fade-up";

type CtaT = {
  badge: string;
  h2: string;
  sub: string;
  cta1: string;
  cta2: string;
  trust: readonly string[];
};

export function FinalCTASection({ t, isAr }: { t: CtaT; isAr: boolean }) {
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-brand-900 py-20 md:py-28">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-brand-600/20 blur-[100px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/30 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <FadeUp>
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2">
            <Rocket className="h-3.5 w-3.5 text-teal" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-teal">
              {t.badge}
            </span>
          </div>

          {/* Headline */}
          <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            {t.h2}
          </h2>

          <p className="mx-auto mb-10 max-w-xl text-lg text-brand-200">{t.sub}</p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-8 py-4 text-base font-bold text-white transition-all hover:bg-teal/90 hover:shadow-xl hover:shadow-teal/20 active:scale-[0.98] sm:w-auto"
            >
              <Upload className="h-5 w-5" />
              {t.cta1}
            </Link>
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/8 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/12 hover:border-white/30 sm:w-auto"
            >
              {t.cta2}
              <Arrow className="h-5 w-5" />
            </Link>
          </div>

          {/* Trust row */}
          <div
            className={`mt-8 flex flex-wrap items-center justify-center gap-6 ${
              isAr ? "flex-row-reverse" : ""
            }`}
          >
            {t.trust.map((item) => (
              <div
                key={item}
                className={`flex items-center gap-1.5 ${isAr ? "flex-row-reverse" : ""}`}
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" />
                <span className="text-sm text-brand-300">{item}</span>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
