"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Panel } from "@/components/panel";
import { getAIReport, listAIReports, streamAIReport } from "@/lib/ai-reports";
import { listResumes } from "@/lib/resumes";
import type { AIReportFull, AIReportListItem, ResumeListItem } from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

type ReportSection = { id: string; title: string; shortTitle: string; content: string };

function parseReportSections(text: string, shortTitles: Record<number, string>): ReportSection[] {
  const regex = /^## (Section (\d+) — .+)$/gm;
  const sections: ReportSection[] = [];
  let match: RegExpExecArray | null;
  let lastEnd = 0;
  let lastTitle = "";
  let lastNum = 0;

  while ((match = regex.exec(text)) !== null) {
    if (lastTitle) {
      sections.push({
        id: `sec-${lastNum}`,
        title: lastTitle,
        shortTitle: shortTitles[lastNum] ?? `Section ${lastNum}`,
        content: text.slice(lastEnd, match.index).trim(),
      });
    }
    lastTitle = match[1];
    lastNum = parseInt(match[2]);
    lastEnd = match.index + match[0].length;
  }
  if (lastTitle) {
    sections.push({
      id: `sec-${lastNum}`,
      title: lastTitle,
      shortTitle: shortTitles[lastNum] ?? `Section ${lastNum}`,
      content: text.slice(lastEnd).trim(),
    });
  }
  return sections;
}

function extractAtsScore(text: string): number | null {
  const m = text.match(/\*\*ATS Score:\s*(\d+)\/100\*\*/i);
  return m ? parseInt(m[1]) : null;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreRingColor(s: number) {
  return s >= 80 ? "#00A878" : s >= 65 ? "#f59e0b" : s >= 50 ? "#f97316" : "#ef4444";
}
function scoreGrade(s: number) {
  return s >= 85 ? "A" : s >= 70 ? "B" : s >= 55 ? "C" : "D";
}
function scoreLabel(s: number, labels: { excellent: string; good: string; fair: string; needsWork: string }) {
  return s >= 80 ? labels.excellent : s >= 65 ? labels.good : s >= 50 ? labels.fair : labels.needsWork;
}
function scoreTextColor(s: number) {
  return s >= 80 ? "text-teal" : s >= 65 ? "text-amber-600" : s >= 50 ? "text-orange-500" : "text-rose-500";
}
function scoreBorderBg(s: number) {
  return s >= 80
    ? "border-teal-light bg-teal-light/10"
    : s >= 65
    ? "border-amber-200 bg-amber-50/60"
    : s >= 50
    ? "border-orange-200 bg-orange-50/60"
    : "border-rose-200 bg-rose-50/60";
}

// ─── ATS Score Ring ───────────────────────────────────────────────────────────

type ScoreLabels = { excellent: string; good: string; fair: string; needsWork: string };
type AtsMessages = { strong: string; good: string; moderate: string; gaps: string };

function AtsScoreRing({ score, atsMatchScore, scoreLabels, atsMessages }: {
  score: number;
  atsMatchScore: string;
  scoreLabels: ScoreLabels;
  atsMessages: AtsMessages;
}) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = scoreRingColor(score);
  const grade = scoreGrade(score);

  return (
    <div className={`flex items-center gap-6 rounded-2xl border p-5 ${scoreBorderBg(score)}`}>
      {/* Ring */}
      <div className="relative h-28 w-28 flex-shrink-0">
        <div
          className="pointer-events-none absolute inset-0 rounded-full opacity-20 blur-lg"
          style={{ background: color }}
        />
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 104 104">
          <circle cx="52" cy="52" r={r} fill="none" strokeWidth="7" stroke="#e2e8f0" />
          <circle
            cx="52" cy="52" r={r} fill="none"
            strokeWidth="7"
            strokeDasharray={`${filled} ${circ}`}
            strokeLinecap="round"
            style={{
              stroke: color,
              filter: `drop-shadow(0 0 6px ${color}60)`,
              transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className={`text-3xl font-black leading-none tabular-nums ${scoreTextColor(score)}`}>{score}</span>
          <span className="text-[10px] font-medium text-slate-400">/100</span>
          <span
            className="mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold"
            style={{ color, borderColor: `${color}40`, background: `${color}15` }}
          >
            {grade}
          </span>
        </div>
      </div>

      {/* Info */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{atsMatchScore}</p>
        <p className={`mt-1 text-2xl font-black tracking-tight ${scoreTextColor(score)}`}>{scoreLabel(score, scoreLabels)}</p>
        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
          {score >= 80 ? atsMessages.strong : score >= 65 ? atsMessages.good : score >= 50 ? atsMessages.moderate : atsMessages.gaps}
        </p>
      </div>
    </div>
  );
}

// ─── Section icons map ────────────────────────────────────────────────────────

const SECTION_ICONS: Record<number, JSX.Element> = {
  1: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  2: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  3: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  4: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  5: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  6: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
};

const SECTION_GRADIENT: Record<number, string> = {
  1: "from-brand-800/8 via-white to-teal/5",
  2: "from-teal/8 via-white to-brand-800/5",
  3: "from-brand-800/8 via-white to-teal/5",
  4: "from-teal/8 via-white to-brand-800/5",
  5: "from-amber-500/8 via-white to-amber-500/3",
  6: "from-brand-800/8 via-white to-teal/5",
};

const SECTION_ICON_BG: Record<number, string> = {
  1: "bg-brand-50 text-brand-700",
  2: "bg-teal-light/30 text-teal",
  3: "bg-brand-50 text-brand-700",
  4: "bg-teal-light/30 text-teal",
  5: "bg-amber-50 text-amber-700",
  6: "bg-brand-50 text-brand-700",
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

const PROSE_CLS =
  "prose prose-slate max-w-none text-sm leading-relaxed " +
  "prose-headings:font-semibold prose-headings:text-slate-900 " +
  "prose-h2:text-base prose-h3:text-sm " +
  "prose-strong:text-slate-800 " +
  "prose-li:my-0.5 " +
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-xs " +
  "[&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top " +
  "[&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_th]:text-left ";

function SectionContent({ content }: { content: string }) {
  return (
    <div className={PROSE_CLS}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

// ─── Section 1 parser & renderer ─────────────────────────────────────────────

type BulletItem = { title: string; detail: string };
type Section1Data = { intro: string; roles: string[]; strengths: BulletItem[]; gaps: BulletItem[] };

function parseSection1(content: string): Section1Data | null {
  const lines = content.split("\n");

  function findHeadingLine(pattern: RegExp): number {
    return lines.findIndex((l) => pattern.test(l));
  }

  const rolesIdx     = findHeadingLine(/most suitable roles/i);
  const strengthsIdx = findHeadingLine(/top 3 strengths/i);
  const gapsIdx      = findHeadingLine(/top 3 gaps|hiring risk/i);

  if (rolesIdx === -1 && strengthsIdx === -1 && gapsIdx === -1) return null;

  const firstIdx = [rolesIdx, strengthsIdx, gapsIdx]
    .filter((i) => i !== -1)
    .reduce((a, b) => Math.min(a, b), lines.length);

  const intro = lines.slice(0, firstIdx).join("\n").trim();

  function extractBullets(startIdx: number, endIdx: number): string[] {
    if (startIdx === -1) return [];
    const end = endIdx === -1 ? lines.length : endIdx;
    return lines
      .slice(startIdx + 1, end)
      .filter((l) => /^\s*[-*•]\s+/.test(l))
      .map((l) => l.replace(/^\s*[-*•]\s+/, "").trim())
      .filter(Boolean);
  }

  function parseBulletItem(item: string): BulletItem {
    const boldMatch = item.match(/^\*\*(.+?)\*\*[:\s—–-]+\s*(.*)$/);
    if (boldMatch) return { title: boldMatch[1].trim(), detail: boldMatch[2].trim() };
    const colonMatch = item.match(/^([^:]+):\s+(.+)$/);
    if (colonMatch) return { title: colonMatch[1].trim(), detail: colonMatch[2].trim() };
    return { title: item, detail: "" };
  }

  const rolesEnd    = strengthsIdx !== -1 ? strengthsIdx : gapsIdx;
  const strengthsEnd = gapsIdx;

  return {
    intro,
    roles:     extractBullets(rolesIdx, rolesEnd),
    strengths: extractBullets(strengthsIdx, strengthsEnd).map(parseBulletItem),
    gaps:      extractBullets(gapsIdx, -1).map(parseBulletItem),
  };
}

function Section1Content({ content }: { content: string }) {
  const parsed = parseSection1(content);

  if (!parsed || (parsed.roles.length === 0 && parsed.strengths.length === 0 && parsed.gaps.length === 0)) {
    return <SectionContent content={content} />;
  }

  return (
    <div className="space-y-5">
      {parsed.intro && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
          <p className="text-sm leading-7 text-slate-600">{parsed.intro}</p>
        </div>
      )}

      {parsed.roles.length > 0 && (
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            Most Suitable Roles
          </p>
          <div className="flex flex-wrap gap-2">
            {parsed.roles.map((role, i) => (
              <span key={i} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {parsed.strengths.length > 0 && (
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Top Strengths
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {parsed.strengths.map((item, i) => (
              <div key={i} className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-2.5 w-2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[12px] font-bold leading-tight text-emerald-800">{item.title}</p>
                    {item.detail && <p className="mt-1 text-[11px] leading-5 text-emerald-700/80">{item.detail}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {parsed.gaps.length > 0 && (
        <div>
          <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Gaps / Hiring Risks
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            {parsed.gaps.map((item, i) => (
              <div key={i} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="h-2.5 w-2.5">
                      <line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[12px] font-bold leading-tight text-amber-800">{item.title}</p>
                    {item.detail && <p className="mt-1 text-[11px] leading-5 text-amber-700/80">{item.detail}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section 2 parser & renderer ─────────────────────────────────────────────

type MarkdownTable = { headers: string[]; rows: string[][] };

function parseMarkdownTable(content: string): MarkdownTable | null {
  const tableLines = content.split("\n").filter((l) => l.trim().startsWith("|"));
  if (tableLines.length < 3) return null;

  const parseRow = (line: string): string[] =>
    line.split("|").slice(1, -1).map((cell) => cell.trim());

  const headers = parseRow(tableLines[0]);
  const rows = tableLines.slice(2).map(parseRow).filter((r) => r.some((c) => c.length > 0));

  return headers.length >= 2 && rows.length > 0 ? { headers, rows } : null;
}

function statusBadgeCls(status: string): string {
  const s = status.toLowerCase();
  if (/good|strong|present|excellent|clear|high/.test(s)) return "bg-teal-light/30 text-teal border-teal-light";
  if (/fair|moderate|partial|average|limited/.test(s)) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

function Section2Content({ content }: { content: string }) {
  const table = parseMarkdownTable(content);

  if (!table) return <SectionContent content={content} />;

  return (
    <div className="space-y-3">
      {table.rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-slate-900">{row[0]}</p>
            {row[1] && (
              <span className={`inline-flex flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${statusBadgeCls(row[1])}`}>
                {row[1]}
              </span>
            )}
          </div>
          {row[2] && (
            <p className="mt-2 text-xs leading-5 text-amber-700">
              <span className="font-semibold">Issue: </span>{row[2]}
            </p>
          )}
          {row[3] && (
            <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-teal">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-3 w-3 flex-shrink-0">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              {row[3]}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Section 3: Professional Analysis ────────────────────────────────────────

function Section3Content({ content }: { content: string }) {
  const table = parseMarkdownTable(content);
  if (!table || table.rows.length === 0) return <SectionContent content={content} />;

  function scoreCls(n: number) {
    return n >= 8 ? "text-teal" : n >= 6 ? "text-amber-500" : "text-red-500";
  }
  function barCls(n: number) {
    return n >= 8 ? "bg-teal" : n >= 6 ? "bg-amber-400" : "bg-red-400";
  }

  return (
    <div className="space-y-3">
      {table.rows.map((row, i) => {
        const raw = row[1] ?? "";
        const m = raw.match(/(\d+)/);
        const score = m ? parseInt(m[1]) : null;
        const norm = score !== null ? (score > 10 ? score / 10 : score) : null;
        return (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold text-slate-900">{row[0]}</p>
              {norm !== null && (
                <span className={`text-sm font-black tabular-nums ${scoreCls(norm)}`}>
                  {score}/10
                </span>
              )}
            </div>
            {norm !== null && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${barCls(norm)}`}
                  style={{ width: `${(norm / 10) * 100}%` }}
                />
              </div>
            )}
            {row[2] && <p className="mt-2 text-xs leading-5 text-slate-500">{row[2]}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section 4: Career Recommendations ───────────────────────────────────────

function Section4Content({ content }: { content: string }) {
  return <SectionContent content={content} />;
}

// ─── Section 5: Quick Wins ────────────────────────────────────────────────────

function Section5Content({ content }: { content: string }) {
  const table = parseMarkdownTable(content);
  if (!table || table.rows.length === 0) return <SectionContent content={content} />;

  function priorityCls(p: string) {
    if (/high/i.test(p)) return { card: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-500" };
    if (/medium|med/i.test(p)) return { card: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-400" };
    return { card: "border-teal-light bg-teal-light/20 text-teal", dot: "bg-teal" };
  }

  const pIdx = Math.max(0, table.headers.findIndex((h) => /priority/i.test(h)));
  const aIdx = Math.max(1, table.headers.findIndex((h) => /action/i.test(h)));

  const groups = [
    { label: "High Priority",   rows: table.rows.filter((r) => /high/i.test(r[pIdx] ?? "")), cls: priorityCls("high") },
    { label: "Medium Priority", rows: table.rows.filter((r) => /medium|med/i.test(r[pIdx] ?? "")), cls: priorityCls("medium") },
    { label: "Low Priority",    rows: table.rows.filter((r) => !/high|medium|med/i.test(r[pIdx] ?? "")), cls: priorityCls("low") },
  ].filter((g) => g.rows.length > 0);

  let counter = 0;
  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi}>
          <div className="mb-2 flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${group.cls.dot}`} />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{group.label}</p>
          </div>
          <div className="space-y-2">
            {group.rows.map((row, ri) => {
              counter += 1;
              const n = counter;
              return (
                <div key={ri} className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${group.cls.card}`}>
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-black opacity-70">
                    {n}
                  </span>
                  <p className="text-[12px] font-medium leading-5">{row[aIdx]}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section 6: Interview Q&A ─────────────────────────────────────────────────

type QAPair = { question: string; answer: string };

function parseInterviewQA(content: string): QAPair[] {
  const pairs: QAPair[] = [];
  const lines = content.split("\n");
  let currentQ: string | null = null;
  let currentA: string[] = [];

  for (const line of lines) {
    const m = line.match(/^\*\*Q:\s*(.+?)(\*\*)?$/i);
    if (m) {
      if (currentQ) pairs.push({ question: currentQ, answer: currentA.join("\n").trim() });
      currentQ = m[1].replace(/\*+$/, "").trim();
      currentA = [];
    } else if (currentQ && line.trim()) {
      currentA.push(line);
    }
  }
  if (currentQ) pairs.push({ question: currentQ, answer: currentA.join("\n").trim() });
  return pairs;
}

function Section6Content({ content }: { content: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const pairs = parseInterviewQA(content);

  if (pairs.length === 0) return <SectionContent content={content} />;

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-xl border transition-all ${
              isOpen ? "border-brand-200 bg-brand-50/40" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="flex w-full items-start gap-3 px-4 py-3 text-left"
            >
              <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-black text-brand-700">
                {i + 1}
              </span>
              <p className={`flex-1 text-sm font-semibold ${isOpen ? "text-brand-800" : "text-slate-800"}`}>
                {pair.question}
              </p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {isOpen && (
              <div className="border-t border-brand-100 px-4 pb-4 pt-3">
                <div className={PROSE_CLS}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{pair.answer}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Section-aware dispatcher ─────────────────────────────────────────────────

function SectionContentByNum({ num, content }: { num: number; content: string }) {
  if (num === 1) return <Section1Content content={content} />;
  if (num === 2) return <Section2Content content={content} />;
  if (num === 3) return <Section3Content content={content} />;
  if (num === 4) return <Section4Content content={content} />;
  if (num === 5) return <Section5Content content={content} />;
  if (num === 6) return <Section6Content content={content} />;
  return <SectionContent content={content} />;
}

// ─── Structured report view ───────────────────────────────────────────────────

type StructuredReportTranslations = {
  cvAnalysisReport: string;
  resumeWithTitle: (title: string) => string;
  exportPdf: string;
  sectionOf: (n: number, total: number) => string;
  atsMatchScore: string;
  scoreLabels: ScoreLabels;
  atsMessages: AtsMessages;
  shortTitles: Record<number, string>;
};

function StructuredReport({
  text,
  resumeTitle,
  date,
  translations,
}: {
  text: string;
  resumeTitle?: string;
  date?: string;
  translations: StructuredReportTranslations;
}) {
  const sections = parseReportSections(text, translations.shortTitles);
  const atsScore = extractAtsScore(text);
  const [activeTab, setActiveTab] = useState(0);

  if (sections.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className={PROSE_CLS}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const safeTab = Math.min(activeTab, sections.length - 1);
  const activeSection = sections[safeTab];
  const activeNum = safeTab + 1;
  const activeIcon = SECTION_ICONS[activeNum];
  const activeGradient = SECTION_GRADIENT[activeNum] ?? "from-brand-800/8 via-white to-teal/5";
  const activeIconBg = SECTION_ICON_BG[activeNum] ?? "bg-brand-50 text-brand-700";

  return (
    <div id="analysis-print-root">
      {/* Print header */}
      <div className="mb-5 hidden print:block">
        <h1 className="text-2xl font-bold text-slate-900">{translations.cvAnalysisReport}</h1>
        {resumeTitle && (
          <p className="mt-1 text-sm text-slate-500">
            {translations.resumeWithTitle(resumeTitle)}{date ? ` · ${date}` : ""}
          </p>
        )}
      </div>

      {/* Export + ATS hero */}
      <div className="mb-6 space-y-4" data-no-print>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-800"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 17V3M7 12l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round" />
            </svg>
            {translations.exportPdf}
          </button>
        </div>

        {atsScore !== null && (
          <AtsScoreRing
            score={atsScore}
            atsMatchScore={translations.atsMatchScore}
            scoreLabels={translations.scoreLabels}
            atsMessages={translations.atsMessages}
          />
        )}
      </div>

      {/* ── Tabbed sections — screen only ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-no-print>
        {/* Tab bar */}
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/60">
          {sections.map((s, i) => {
            const tabNum = i + 1;
            const isActive = i === safeTab;
            const tabIcon = SECTION_ICONS[tabNum];
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveTab(i)}
                className={[
                  "flex items-center gap-2 whitespace-nowrap px-4 py-3.5 text-xs font-semibold transition border-b-2 -mb-px",
                  isActive
                    ? "border-brand-800 text-brand-800 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/60",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg transition",
                    isActive ? SECTION_ICON_BG[tabNum] ?? "bg-brand-50 text-brand-700" : "bg-slate-200/60 text-slate-400",
                  ].join(" ")}
                >
                  {tabIcon}
                </span>
                {s.shortTitle}
              </button>
            );
          })}
        </div>

        {/* Active section */}
        <div className={`bg-gradient-to-br ${activeGradient}`}>
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${activeIconBg}`}>
              {activeIcon ?? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {translations.sectionOf(activeNum, sections.length)}
              </p>
              <h2 className="mt-0.5 text-sm font-bold text-slate-900">{activeSection.title}</h2>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <SectionContentByNum num={activeNum} content={activeSection.content} />
          </div>
        </div>
      </div>

      {/* ── Print: all sections stacked ── */}
      <div className="hidden print:block space-y-4">
        {sections.map((s, i) => {
          const num = i + 1;
          const icon = SECTION_ICONS[num];
          const gradient = SECTION_GRADIENT[num] ?? "from-brand-800/8 via-white to-teal/5";
          const iconBg = SECTION_ICON_BG[num] ?? "bg-brand-50 text-brand-700";
          return (
            <div key={s.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white" data-print-section>
              <div className={`flex items-center gap-3 border-b border-slate-100 bg-gradient-to-br ${gradient} px-5 py-4`}>
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                  {icon ?? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    {translations.sectionOf(num, sections.length)}
                  </p>
                  <h2 className="mt-0.5 text-sm font-bold text-slate-900">{s.title}</h2>
                </div>
              </div>
              <div className="p-5 md:p-6">
                <SectionContentByNum num={num} content={s.content} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Next Steps panel ────────────────────────────────────────────────────────

function NextStepsPanel({
  atsScore,
  jobDescription,
  jobTitle,
}: {
  atsScore: number | null;
  jobDescription: string;
  jobTitle?: string;
}) {
  const t = useTranslations("analysisPage.nextSteps");

  function goToInterview() {
    if (typeof window !== "undefined") {
      if (jobDescription) sessionStorage.setItem("jobai_interview_jd", jobDescription);
      if (jobTitle) sessionStorage.setItem("jobai_interview_jd_title", jobTitle);
    }
    window.location.href = "/dashboard/ai-interview";
  }

  const scoreMsg =
    atsScore === null
      ? null
      : atsScore >= 80
      ? t("scoreStrong")
      : atsScore >= 60
      ? t("scoreGood")
      : t("scoreNeedsWork");

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5" data-no-print>
      <div className="px-6 py-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">{t("eyebrow")}</p>
        <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{t("title")}</h2>
        {scoreMsg && <p className="mt-1.5 text-sm text-slate-500">{scoreMsg}</p>}
      </div>

      <div className="grid gap-3 px-6 pb-6 sm:grid-cols-3">
        {/* Find jobs */}
        <Link
          href="/dashboard/job-search"
          className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-800 group-hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{t("findJobs")}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{t("findJobsDesc")}</p>
          </div>
        </Link>

        {/* Practice interview */}
        <button
          type="button"
          onClick={goToInterview}
          className="group flex flex-col items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 text-left transition hover:border-brand-400 hover:bg-brand-50 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-brand-900">{t("practiceInterview")}</p>
            <p className="mt-0.5 text-xs leading-5 text-brand-700">
              {jobDescription ? t("jdPreloaded") : t("simulateMock")}
            </p>
          </div>
        </button>

        {/* SmartSend */}
        <Link
          href="/dashboard/smart-send"
          className="group flex flex-col gap-3 rounded-2xl border border-teal-light bg-teal-light/10 p-4 transition hover:border-teal hover:bg-teal-light/20 hover:shadow-sm"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-teal">{t("sendWithSmartSend")}</p>
            <p className="mt-0.5 text-xs leading-5 text-teal/80">{t("sendInBatches")}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-teal-light/30 text-teal border-teal-light",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  failed:    "bg-rose-50 text-rose-700 border-rose-200",
};

function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_BADGE[status] ?? STATUS_BADGE.pending}`}>
      {label ?? status}
    </span>
  );
}

// ─── Streaming stage indicator ────────────────────────────────────────────────

const STREAM_STAGE_PCTS = [10, 30, 60, 85];

function useStreamStage(isStreaming: boolean, textLen: number): number | null {
  const idx =
    !isStreaming ? -1
    : textLen === 0 ? 0
    : textLen < 200 ? 1
    : textLen < 1000 ? 2
    : 3;
  return idx >= 0 ? idx : null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

type PageState = "idle" | "streaming" | "done" | "error";

export default function DashboardAnalysisPage() {
  const t = useTranslations("analysisPage");
  const [resumes, setResumes]               = useState<ResumeListItem[]>([]);
  const [selectedResume, setSelectedResume] = useState("");
  const [reportLanguage, setReportLanguage] = useState("English");
  const [jobDescription, setJobDescription] = useState("");

  const [pageState, setPageState]     = useState<PageState>("idle");
  const [streamText, setStreamText]   = useState("");
  const [streamError, setStreamError] = useState("");
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  const [reports, setReports]     = useState<AIReportListItem[]>([]);
  const [viewReport, setViewReport] = useState<AIReportFull | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const outputRef  = useRef<HTMLDivElement>(null);
  const reportRef  = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    const [resumeList, reportList] = await Promise.all([
      listResumes().catch(() => [] as ResumeListItem[]),
      listAIReports("analysis").catch(() => [] as AIReportListItem[]),
    ]);
    setResumes(resumeList);
    setReports(reportList);
    if (resumeList.length > 0 && !selectedResume) setSelectedResume(resumeList[0].id);
  }, [selectedResume]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefill = sessionStorage.getItem("jobai_prefill_jd");
    if (prefill) {
      setJobDescription(prefill);
      sessionStorage.removeItem("jobai_prefill_jd");
      sessionStorage.removeItem("jobai_prefill_jd_title");
    }
  }, []);

  useEffect(() => {
    if (pageState === "streaming") outputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [streamText, pageState]);

  async function handleRequestAnalysis() {
    if (!selectedResume) return;
    setPageState("streaming");
    setStreamText("");
    setStreamError("");
    setActiveReportId(null);
    setViewReport(null);
    try {
      await streamAIReport(selectedResume, jobDescription, (event) => {
        if (event.type === "id")    setActiveReportId(event.report_id);
        if (event.type === "chunk") setStreamText((prev) => prev + event.text);
        if (event.type === "done")  { setActiveReportId(event.report_id); setPageState("done"); void loadData(); }
        if (event.type === "error") { setStreamError(event.message); setPageState("error"); }
      }, "analysis", reportLanguage);
    } catch (e) {
      setStreamError(e instanceof Error ? e.message : "Request failed.");
      setPageState("error");
    }
  }

  async function handleViewReport(id: string) {
    if (viewReport?.id === id) { setViewReport(null); setStreamText(""); setPageState("idle"); return; }
    setViewLoading(true);
    try {
      const report = await getAIReport(id);
      setViewReport(report);
      setStreamText(report.report_text ?? "");
      setPageState("done");
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch { /* ignore */ }
    finally { setViewLoading(false); }
  }

  const hasOutput = streamText.length > 0;
  const canSubmit = selectedResume && pageState !== "streaming";
  const activeReport = viewReport ?? (activeReportId ? reports.find((r) => r.id === activeReportId) : null);
  const stageIdx = useStreamStage(pageState === "streaming", streamText.length);

  const streamStageLabels = [
    t("streamStages.connecting"),
    t("streamStages.reading"),
    t("streamStages.analyzing"),
    t("streamStages.composing"),
  ];
  const scoreLabels: ScoreLabels = {
    excellent: t("scoreLabels.excellent"),
    good:      t("scoreLabels.good"),
    fair:      t("scoreLabels.fair"),
    needsWork: t("scoreLabels.needsWork"),
  };
  const atsMessages: AtsMessages = {
    strong:   t("atsMessages.strong"),
    good:     t("atsMessages.good"),
    moderate: t("atsMessages.moderate"),
    gaps:     t("atsMessages.gaps"),
  };
  const statusLabels: Record<string, string> = {
    completed: t("statusLabels.completed"),
    pending:   t("statusLabels.pending"),
    failed:    t("statusLabels.failed"),
  };
  const reportTranslations: StructuredReportTranslations = {
    cvAnalysisReport: t("cvAnalysisReport"),
    resumeWithTitle: (title) => t("resumeWithTitle", { title }),
    exportPdf: t("exportPdf"),
    sectionOf: (n, total) => t("sectionOf", { n, total }),
    atsMatchScore: t("atsMatchScore"),
    scoreLabels,
    atsMessages,
    shortTitles: {
      1: t("shortTitles.summary"),
      2: t("shortTitles.atsScore"),
      3: t("shortTitles.proAnalysis"),
      4: t("shortTitles.careerPlan"),
      5: t("shortTitles.quickWins"),
      6: t("shortTitles.interviewQA"),
    },
  };

  return (
    <div className="space-y-6">
      {/* ─── Hero header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 p-6 md:p-8" data-no-print>
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-800/8 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-teal/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-800 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">{t("eyebrow")}</p>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("title")}</h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{t("description")}</p>
            </div>
          </div>

          {/* Score pill — shown after analysis */}
          {pageState === "done" && hasOutput && (() => {
            const s = extractAtsScore(streamText);
            if (s === null) return null;
            return (
              <div
                className="inline-flex items-center gap-2 rounded-xl border px-4 py-2"
                style={{ borderColor: `${scoreRingColor(s)}40`, background: `${scoreRingColor(s)}12` }}
              >
                <span className="text-2xl font-black tabular-nums" style={{ color: scoreRingColor(s) }}>{s}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t("atsScore")}</p>
                  <p className="text-xs font-semibold" style={{ color: scoreRingColor(s) }}>{scoreLabel(s, scoreLabels)}</p>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─── History panel — shown first for quick access ─────────── */}
      <Panel className="overflow-hidden" data-no-print>
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t("pastReports")}</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
            {reports.length === 1 ? t("savedReports_one") : t("savedReports_other", { count: reports.length })}
          </h2>
        </div>

        {reports.length === 0 ? (
          <div className="mx-6 mb-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-900">{t("noReports")}</p>
            <p className="mt-1 text-xs text-slate-500">{t("noReportsDesc")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{t("table.resume")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{t("table.status")}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{t("table.date")}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-brand-50/30">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{r.resume_title ?? t("resumeLabel")}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-400">{r.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={r.status} label={statusLabels[r.status] ?? r.status} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(r.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={r.status !== "completed" || viewLoading}
                        onClick={() => void handleViewReport(r.id)}
                        className={[
                          "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                          viewReport?.id === r.id
                            ? "border-brand-800 bg-brand-800 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-800",
                          "disabled:cursor-not-allowed disabled:opacity-40",
                        ].join(" ")}
                      >
                        {viewReport?.id === r.id ? t("close") : t("view")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ─── Input panel ──────────────────────────────────────────── */}
      <Panel className="p-6 md:p-8" data-no-print>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{t("newAnalysis")}</p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">{t("pickAndRun")}</h2>

        <div className="mt-5 space-y-4">
          {/* Language selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="language-select">{t("reportLanguageLabel")}</label>
            <select
              id="language-select"
              value={reportLanguage}
              onChange={(e) => setReportLanguage(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Arabic">العربية</option>
              <option value="French">Français</option>
            </select>
          </div>

          {/* Resume selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="resume-select">{t("resumeLabel")}</label>
            {resumes.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t("noResumesYet")}{" "}
                <a href="/dashboard/resumes" className="font-semibold text-brand-800 underline underline-offset-2">{t("uploadCvLink")}</a>
              </p>
            ) : (
              <select
                id="resume-select"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.source_filename ?? r.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* JD textarea */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="jd-input">
              {t("jdLabel")}{" "}
              <span className="font-normal text-slate-400">{t("jdOptional")}</span>
            </label>
            <textarea
              id="jd-input"
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder={t("jdPlaceholder")}
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Run button */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => void handleRequestAnalysis()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-800/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pageState === "streaming" ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
                {t("generatingReport")}
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {t("runAnalysis")}
              </>
            )}
          </button>
        </div>
      </Panel>

      {/* ─── Streaming: progress bar + live markdown ─────────────── */}
      {pageState === "streaming" && (
        <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
          <div className="border-b border-brand-100 bg-gradient-to-br from-brand-800/8 via-white to-teal/5 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z" /><path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">{t("buildingReport")}</p>
                  <p className="text-sm font-semibold text-slate-800">{stageIdx !== null ? streamStageLabels[stageIdx] : "…"}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-teal" />
                {t("streaming")}
              </span>
            </div>
            <div className="mt-4">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-700 to-teal transition-all duration-700"
                  style={{ width: `${stageIdx !== null ? STREAM_STAGE_PCTS[stageIdx] : 10}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-400">
                {STREAM_STAGE_PCTS.map((pct, i) => (
                  <span key={i} className={`font-medium ${stageIdx !== null && stageIdx >= i ? "text-brand-700" : ""}`}>
                    {pct}%
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6" ref={outputRef}>
            <div className={PROSE_CLS}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* ─── Error ───────────────────────────────────────────────── */}
      {pageState === "error" && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-rose-700">{streamError}</p>
        </div>
      )}

      {/* ─── Report area — single render location ────────────────── */}
      <div ref={reportRef}>
        {pageState === "done" && hasOutput && (
          <div>
            {activeReport && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-500" data-no-print>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 flex-shrink-0">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="font-semibold text-slate-700">{activeReport.resume_title}</span>
                <span>·</span>
                <span>{formatDate(activeReport.created_at)}</span>
              </div>
            )}
            <StructuredReport
              text={streamText}
              resumeTitle={activeReport?.resume_title ?? undefined}
              date={activeReport ? formatDate(activeReport.created_at) : undefined}
              translations={reportTranslations}
            />
            <NextStepsPanel
              atsScore={extractAtsScore(streamText)}
              jobDescription={jobDescription}
              jobTitle={sessionStorage.getItem?.("jobai_prefill_jd_title") ?? undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
