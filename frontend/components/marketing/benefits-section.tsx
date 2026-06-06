"use client";

import { Clock, TrendingUp, Shield, Star, Users, Rocket } from "lucide-react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";
import type { ElementType } from "react";

type BenefitItem = { icon: string; title: string; desc: string };
type BenefitsT = {
  badge: string;
  h2: string;
  sub: string;
  items: readonly BenefitItem[];
};

const ICON_MAP: Record<string, ElementType> = {
  clock: Clock,
  trending: TrendingUp,
  shield: Shield,
  star: Star,
  users: Users,
  rocket: Rocket,
};

const ICON_COLORS = [
  "bg-brand-50 text-brand-600",
  "bg-teal-light/40 text-teal",
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
  "bg-purple-50 text-purple-600",
  "bg-mint-light/40 text-mint",
];

export function BenefitsSection({ t, isAr }: { t: BenefitsT; isAr: boolean }) {
  return (
    <section className="bg-slate-50 py-20 md:py-28">
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
          {t.items.map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? Rocket;
            const colorClass = ICON_COLORS[i % ICON_COLORS.length];

            return (
              <FadeUp key={i} delay={i * 70}>
                <div
                  className={`flex gap-4 rounded-2xl border border-white bg-white p-5 shadow-sm transition-all hover:shadow-panel ${
                    isAr ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className="shrink-0">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <h3 className="mb-1 font-bold text-slate-950">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
