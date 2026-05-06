"use client";

import { useTranslations } from "next-intl";

import { fmtDate, initials, scoreText, STAGE_OPTIONS } from "./utils";
import type { CandidateDetail, Stage } from "./types";

type ScoreRingProps = { value: number | null; label: string };

function ScoreRing({ value, label }: ScoreRingProps) {
  const v = value ?? 0;
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, v)) / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-14 w-14">
        <svg className="-rotate-90" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r={radius} stroke="#f1f5f9" strokeWidth="4" />
          <circle
            cx="28" cy="28" r={radius}
            stroke={value === null ? "#e2e8f0" : v >= 70 ? "#10b981" : v >= 40 ? "#f59e0b" : "#f43f5e"}
            strokeWidth="4"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
          value === null ? "text-slate-300" : v >= 70 ? "text-emerald-700" : v >= 40 ? "text-amber-700" : "text-rose-600"
        }`}>
          {value === null ? "—" : `${v.toFixed(0)}%`}
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    </div>
  );
}

type Props = {
  detail: CandidateDetail;
  topScore: number | null;
  stagePending: boolean;
  onStageChange: (stage: Stage) => void;
};

export function CandidateHeader({ detail, topScore, stagePending, onStageChange }: Props) {
  const t = useTranslations("recruiter.candidateDetailPage");
  const displayName = detail.parsed_name ?? detail.title;
  const stageOption = STAGE_OPTIONS.find((s) => s.value === detail.stage)!;

  return (
    <div className="flex flex-wrap items-start gap-4">
      {/* Avatar + info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-sm font-bold text-white">
          {initials(displayName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">{displayName}</h1>
          {detail.parsed_name && detail.parsed_name !== detail.title && (
            <p className="text-xs text-slate-400">{t("resumeFile", { title: detail.title })}</p>
          )}
          {detail.email && <p className="text-xs text-slate-400">{detail.email}</p>}
          <p className="mt-0.5 text-xs text-slate-400">{t("added", { date: fmtDate(detail.created_at) })}</p>
        </div>
      </div>

      {/* Score ring */}
      <div className="flex items-center gap-4">
        <ScoreRing value={topScore} label={t("matchLabel")} />
      </div>

      {/* Stage selector */}
      <div className="flex-shrink-0">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t("stageLabel")}</p>
        <div className="relative">
          <select
            value={detail.stage}
            disabled={stagePending}
            onChange={(e) => onStageChange(e.target.value as Stage)}
            className={`appearance-none rounded-xl border px-3 py-2 pr-7 text-xs font-semibold outline-none transition cursor-pointer ${stageOption.cls}`}
          >
            {STAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{t(`stageOptions.${opt.value}`)}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-60">▾</span>
        </div>
      </div>
    </div>
  );
}
