"use client";

import { Upload, Sparkles, CheckCircle2 } from "lucide-react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";
import type { ElementType } from "react";

type HowT = {
  badge: string;
  h2: string;
  sub: string;
  steps: readonly { num: string; title: string; desc: string }[];
};

const STEP_ICONS: ElementType[] = [Upload, Sparkles, CheckCircle2];

export function HowItWorksSection({ t, isAr }: { t: HowT; isAr: boolean }) {
  return (
    <section id="how-it-works" className="bg-slate-50 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <FadeUp>
          <div className="mb-16 text-center">
            <SectionBadge>{t.badge}</SectionBadge>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {t.h2}
            </h2>
            <p className="mt-3 text-lg text-slate-500">{t.sub}</p>
          </div>
        </FadeUp>

        {/* Steps */}
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {t.steps.map((step, i) => {
            const Icon = STEP_ICONS[i];
            return (
              <FadeUp key={i} delay={i * 130}>
                <div className={`relative ${isAr ? "text-right" : ""}`}>
                  {/* Connector line (desktop only, between steps) */}
                  {i < 2 && (
                    <div
                      className={`absolute top-10 hidden h-px w-full bg-gradient-to-r from-brand-200 to-brand-100 md:block ${
                        isAr ? "right-full" : "left-full"
                      }`}
                      style={{ width: "calc(100% - 80px)", left: isAr ? "auto" : "80px", right: isAr ? "80px" : "auto" }}
                    />
                  )}

                  {/* Icon block */}
                  <div className={`mb-5 flex ${isAr ? "justify-end" : "justify-start"}`}>
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-600/20">
                      <Icon className="h-9 w-9 text-white" />
                      <span
                        className={`absolute -top-2.5 ${
                          isAr ? "-left-2.5" : "-right-2.5"
                        } flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-brand-700 shadow-sm`}
                      >
                        {step.num}
                      </span>
                    </div>
                  </div>

                  <h3 className="mb-2 text-lg font-black text-slate-950">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}
