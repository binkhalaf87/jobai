"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSwitch() {
    const next = locale === "en" ? "ar" : "en";
    // Persist in a long-lived cookie so the server layout picks it up
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={handleSwitch}
      disabled={isPending}
      aria-label={`Switch to ${t("switch")}`}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:opacity-50"
    >
      <span className="text-sm leading-none">🌐</span>
      {t("switch")}
    </button>
  );
}
