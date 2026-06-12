"use client";

import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";

type StatItem = { number: string; label: string };

type StatsT = {
  badge: string;
  h2: string;
  sub: string;
  items: readonly StatItem[];
};

export function StatsSection({ t, isAr }: { t: StatsT; isAr: boolean }) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <FadeUp>
          <div className="mb-14 text-center">
            <SectionBadge>{t.badge}</SectionBadge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.h2}
            </h2>
            <p className="mt-3 text-lg text-slate-500">{t.sub}</p>
          </div>
        </FadeUp>

        {/* Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((item, i) => (
            <FadeUp key={i} delay={i * 70}>
              <div
                className={`flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-6 transition-all hover:shadow-panel ${
                  isAr ? "text-right" : ""
                }`}
              >
                <p className="text-4xl font-black tracking-tight text-brand-600">
                  {item.number}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {item.label}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
