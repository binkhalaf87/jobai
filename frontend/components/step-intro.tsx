import Link from "next/link";

type Benefit = { label: string };

type StepIntroProps = {
  step: number;
  totalSteps?: number;
  title: string;
  description: string;
  benefits?: Benefit[];
  nextStepHref?: string;
  nextStepLabel?: string;
  accentColor?: "violet" | "amber" | "emerald" | "cyan" | "indigo" | "rose";
};

const COLOR_MAP: Record<
  NonNullable<StepIntroProps["accentColor"]>,
  { badge: string; dot: string; next: string }
> = {
  violet: {
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
    next: "text-violet-700 hover:text-violet-900",
  },
  amber: {
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    next: "text-amber-700 hover:text-amber-900",
  },
  emerald: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    next: "text-emerald-700 hover:text-emerald-900",
  },
  cyan: {
    badge: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
    next: "text-cyan-700 hover:text-cyan-900",
  },
  indigo: {
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    next: "text-indigo-700 hover:text-indigo-900",
  },
  rose: {
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    next: "text-rose-700 hover:text-rose-900",
  },
};

export function StepIntro({
  step,
  totalSteps = 6,
  title,
  description,
  benefits = [],
  nextStepHref,
  nextStepLabel,
  accentColor = "violet",
}: StepIntroProps) {
  const colors = COLOR_MAP[accentColor];

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
            Step {step} of {totalSteps}
          </span>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="max-w-xl text-sm leading-6 text-slate-500">{description}</p>
        </div>

        {nextStepHref && nextStepLabel && (
          <Link
            href={nextStepHref}
            className={`flex shrink-0 items-center gap-1 rounded-lg border border-current px-3 py-1.5 text-[12px] font-semibold transition ${colors.next}`}
          >
            {nextStepLabel}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>

      {benefits.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
          {benefits.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${colors.dot}`} />
              {b.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
