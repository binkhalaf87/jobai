"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { scoreColor, scoreText } from "./utils";
import type { CandidateDetail } from "./types";

type Props = { detail: CandidateDetail };

function ScoreBar({ score }: { score: number }) {
  const c = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all ${scoreColor(c)}`} style={{ width: `${c}%` }} />
      </div>
      <span className={`w-12 text-right text-xs font-bold tabular-nums ${scoreText(c)}`}>
        {c.toFixed(1)}%
      </span>
    </div>
  );
}

export function CandidateMatchesPanel({ detail }: Props) {
  const t = useTranslations("recruiter.candidateDetailPage");

  if (detail.matches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">{t("matches.noMatches")}</p>
        <p className="mt-2 text-xs text-slate-500">{t("matches.noMatchesDesc")}</p>
        <Link href="/recruiter/jobs"
          className="mt-4 inline-block rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white">
          {t("matches.goToJobs")}
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {detail.matches.map((match) => (
        <li key={match.job_id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">{match.job_title}</p>
            <span className={`text-lg font-bold tabular-nums ${scoreText(match.overall_score)}`}>
              {match.overall_score.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2"><ScoreBar score={match.overall_score} /></div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {match.matching_keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-emerald-600">{t("matches.matched")}</p>
                <p className="text-xs text-slate-600">
                  {match.matching_keywords.slice(0, 6).join(", ")}
                  {match.matching_keywords.length > 6 && ` +${match.matching_keywords.length - 6}`}
                </p>
              </div>
            )}
            {match.missing_keywords.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-amber-600">{t("matches.missing")}</p>
                <p className="text-xs text-slate-600">
                  {match.missing_keywords.slice(0, 6).join(", ")}
                  {match.missing_keywords.length > 6 && ` +${match.missing_keywords.length - 6}`}
                </p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
