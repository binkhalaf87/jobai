"use client";

import { GraduationCap, Search, TrendingUp, Award, Globe } from "lucide-react";
import type { ElementType } from "react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";

type AudienceItem = { icon: string; label: string };

type AudienceT = {
  badge: string;
  h2: string;
  sub: string;
  items: readonly AudienceItem[];
};

const ICON_MAP: Record<string, ElementType> = {
  graduation: GraduationCap,
  search: Search,
  trending: TrendingUp,
  award: Award,
  globe: Globe,
};

const COLORS = [
  "bg-brand-50 text-brand-600",
  "bg-teal-light/40 text-teal",
  "bg-blue-50 text-blue-600",
  "bg-amber-50 text-amber-600",
  "bg-purple-50 text-purple-600",
];

export function AudienceSection({ t, isAr }: { t: AudienceT; isAr: boolean }) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <div className="mb-14 text-center">
            <SectionBadge>{t.badge}</SectionBadge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.h2}
            </h2>
            <p className="mt-3 text-lg text-slate-500">{t.sub}</p>
          </div>
        </FadeUp>

        {/* First row: 3 cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {t.items.slice(0, 3).map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? GraduationCap;
            const color = COLORS[i % COLORS.length];
            return (
              <FadeUp key={i} delay={i * 80}>
                <div
                  className={`flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 transition-shadow hover:shadow-sm ${
                    isAr ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>

        {/* Second row: 2 cards centered */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:mx-auto sm:max-w-2xl sm:grid-cols-2">
          {t.items.slice(3).map((item, i) => {
            const Icon = ICON_MAP[item.icon] ?? GraduationCap;
            const color = COLORS[(i + 3) % COLORS.length];
            return (
              <FadeUp key={i + 3} delay={(i + 3) * 80}>
                <div
                  className={`flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-5 transition-shadow hover:shadow-sm ${
                    isAr ? "flex-row-reverse text-right" : ""
                  }`}
                >
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
