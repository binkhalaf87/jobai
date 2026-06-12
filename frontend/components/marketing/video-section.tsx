"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { FadeUp } from "./fade-up";
import { SectionBadge } from "./section-badge";

type VideoT = {
  badge: string;
  h2: string;
  sub: string;
  caption: string;
};

export function VideoSection({
  t,
  isAr,
  videoUrl,
}: {
  t: VideoT;
  isAr: boolean;
  videoUrl?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-4xl px-6">
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

        {/* Video container */}
        <FadeUp delay={120}>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 shadow-panel">
            {playing && videoUrl ? (
              <iframe
                src={videoUrl}
                title={t.h2}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => videoUrl && setPlaying(true)}
                aria-label={t.h2}
                className="group flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-brand-900 to-slate-950"
              >
                {/* Decorative glow */}
                <span className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/20 blur-[80px]" />

                {/* Play button */}
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-2xl transition-transform group-hover:scale-110">
                  <Play className={`h-8 w-8 fill-brand-600 text-brand-600 ${isAr ? "-scale-x-100 -translate-x-0.5" : "translate-x-0.5"}`} />
                </span>
              </button>
            )}
          </div>

          {/* Caption */}
          <p className="mt-5 text-center text-sm text-slate-500">{t.caption}</p>
        </FadeUp>
      </div>
    </section>
  );
}
