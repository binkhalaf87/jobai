"use client";

import { Star, BadgeCheck } from "lucide-react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";

type TestimonialItem = {
  initials: string;
  name: string;
  role: string;
  place: string;
  rating: number;
  text: string;
};

type TestimonialsT = {
  badge: string;
  h2: string;
  sub: string;
  verified: string;
  items: readonly TestimonialItem[];
};

const AVATAR_COLORS = [
  "bg-brand-600",
  "bg-teal",
  "bg-brand-800",
  "bg-amber-600",
  "bg-purple-600",
  "bg-slate-700",
];

function TestimonialCard({
  item,
  verified,
  isAr,
  color,
}: {
  item: TestimonialItem;
  verified: string;
  isAr: boolean;
  color: string;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-6 ${
        isAr ? "text-right" : ""
      }`}
    >
      {/* Rating + verified badge */}
      <div className={`mb-4 flex items-center justify-between ${isAr ? "flex-row-reverse" : ""}`}>
        <div className={`flex gap-1 ${isAr ? "flex-row-reverse" : ""}`}>
          {Array.from({ length: 5 }).map((_, j) => (
            <Star
              key={j}
              className={`h-4 w-4 ${
                j < item.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
              }`}
            />
          ))}
        </div>
        <span
          className={`flex items-center gap-1 rounded-full bg-teal-light/40 px-2 py-0.5 text-[10px] font-bold text-teal ${
            isAr ? "flex-row-reverse" : ""
          }`}
        >
          <BadgeCheck className="h-3 w-3" />
          {verified}
        </span>
      </div>

      {/* Quote */}
      <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{item.text}&rdquo;
      </p>

      {/* Author */}
      <div className={`flex items-center gap-3 ${isAr ? "flex-row-reverse" : ""}`}>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white ${color}`}
        >
          {item.initials}
        </div>
        <div className={isAr ? "text-right" : ""}>
          <p className="text-sm font-bold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">
            {item.role} · {item.place}
          </p>
        </div>
      </div>
    </div>
  );
}

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

        {/* Mobile: horizontal snap carousel · Desktop: 3-column grid */}
        <FadeUp>
          <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
            {t.items.map((item, i) => (
              <div key={i} className="w-[85%] shrink-0 snap-center sm:w-[60%] md:w-auto">
                <TestimonialCard
                  item={item}
                  verified={t.verified}
                  isAr={isAr}
                  color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                />
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
