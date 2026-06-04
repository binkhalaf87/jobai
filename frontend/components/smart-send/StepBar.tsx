"use client";

import { useTranslations } from "next-intl";

export function StepBar({ current }: { current: number }) {
  const t = useTranslations("smartSendPage");
  const steps = t.raw("wizard.steps") as string[];
  const total = steps.length;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-1 mb-3">
        {steps.map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
              i + 1 < current ? "bg-teal text-white" :
              i + 1 === current ? "bg-brand-800 text-white" :
              "bg-slate-200 text-slate-400"
            }`}>
              {i + 1 < current ? "✓" : i + 1}
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-5 flex-shrink-0 ${i + 1 < current ? "bg-teal" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        {t("wizard.stepOf", { current, total })}{" "}
        <span className="font-semibold text-slate-700">— {steps[current - 1]}</span>
      </p>
    </div>
  );
}
