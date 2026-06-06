"use client";

import { Target, Sparkles, Mail, Brain, TrendingUp, CheckCircle2 } from "lucide-react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";
import type { ElementType } from "react";

type FeatureItem = {
  icon: string;
  title: string;
  sub: string;
  desc: string;
  bullets: readonly string[];
};

type FeaturesT = {
  badge: string;
  h2: string;
  sub: string;
  items: readonly FeatureItem[];
};

const ICON_MAP: Record<string, ElementType> = {
  target: Target,
  sparkles: Sparkles,
  mail: Mail,
  brain: Brain,
  trending: TrendingUp,
};

export function FeaturesSection({ t, isAr }: { t: FeaturesT; isAr: boolean }) {
  return (
    <section id="features" className="bg-white py-20 md:py-28">
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

        {/* Grid — 2 cols + last card full on sm, 3 cols on lg */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {t.items.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon] ?? Sparkles;
            // Last card spans 2 cols on sm so it's centered
            const spanClass = i === 4 ? "sm:col-span-2 lg:col-span-1" : "";

            return (
              <FadeUp key={i} delay={i * 80} className={spanClass}>
                <div
                  className={`group flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50/80 p-6 transition-all hover:border-brand-100 hover:bg-white hover:shadow-panel ${
                    isAr ? "items-end text-right" : ""
                  }`}
                >
                  {/* Icon */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 transition-colors group-hover:bg-brand-600">
                    <Icon className="h-6 w-6 text-brand-600 transition-colors group-hover:text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="mb-0.5 text-base font-black text-slate-950">{feature.title}</h3>
                  <p className="mb-3 text-sm font-semibold text-brand-600">{feature.sub}</p>

                  {/* Desc */}
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-500">{feature.desc}</p>

                  {/* Bullets */}
                  <ul className="space-y-1.5">
                    {feature.bullets.map((b) => (
                      <li
                        key={b}
                        className={`flex items-center gap-2 text-xs font-medium text-slate-600 ${
                          isAr ? "flex-row-reverse" : ""
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
