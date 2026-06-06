"use client";

import { Star } from "lucide-react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";

type TestimonialItem = {
  initials: string;
  name: string;
  role: string;
  text: string;
};

type TestimonialsT = {
  badge: string;
  h2: string;
  sub: string;
  items: readonly TestimonialItem[];
};

const AVATAR_COLORS = [
  "bg-brand-600",
  "bg-teal",
  "bg-brand-800",
];

export function TestimonialsSection({ t, isAr }: { t: TestimonialsT; isAr: boolean }) {
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

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {t.items.map((item, i) => (
            <FadeUp key={i} delay={i * 110}>
              <div
                className={`flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-6 ${
                  isAr ? "text-right" : ""
                }`}
              >
                {/* Stars */}
                <div
                  className={`mb-4 flex gap-1 ${
                    isAr ? "flex-row-reverse justify-end" : ""
                  }`}
                >
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600">
                  &ldquo;{item.text}&rdquo;
                </p>

                {/* Author */}
                <div
                  className={`flex items-center gap-3 ${
                    isAr ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${AVATAR_COLORS[i]}`}
                  >
                    {item.initials}
                  </div>
                  <div className={isAr ? "text-right" : ""}>
                    <p className="text-sm font-bold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
