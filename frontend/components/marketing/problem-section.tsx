"use client";

import { XCircle } from "lucide-react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";

type ProblemT = {
  badge: string;
  h2: string;
  sub: string;
  items: readonly { icon: string; title: string; desc: string }[];
  bridge: string;
  bridgeSub: string;
};

export function ProblemSection({ t, isAr }: { t: ProblemT; isAr: boolean }) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <FadeUp>
          <div className="mb-12 text-center">
            <SectionBadge>{t.badge}</SectionBadge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.h2}
            </h2>
            <p className="mt-3 text-lg text-slate-500">{t.sub}</p>
          </div>
        </FadeUp>

        {/* Problem cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {t.items.map((item, i) => (
            <FadeUp key={i} delay={i * 90}>
              <div
                className={`flex gap-4 rounded-2xl border border-red-100 bg-red-50/70 p-6 transition-all hover:border-red-200 hover:bg-red-50 ${
                  isAr ? "flex-row-reverse text-right" : ""
                }`}
              >
                <div className="shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1.5 font-bold text-slate-900">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.desc}</p>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Bridge */}
        <FadeUp delay={380}>
          <div className="relative mt-10 overflow-hidden rounded-2xl bg-brand-600 p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-800 opacity-60" />
            <div className="relative">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-brand-200">
                {isAr ? "والحل؟" : "The solution?"}
              </p>
              <h3 className="text-2xl font-black text-white md:text-3xl">{t.bridge}</h3>
              <p className="mt-2 text-sm text-brand-200">{t.bridgeSub}</p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
