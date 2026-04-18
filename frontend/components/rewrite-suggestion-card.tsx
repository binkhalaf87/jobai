"use client";

import { useMemo, useState } from "react";

import { Panel } from "@/components/panel";
import { generateRewriteSuggestions } from "@/lib/analysis";
import type { RewriteSuggestion, SuggestionSection } from "@/types";

const SECTION_OPTIONS: Array<{ label: string; value: SuggestionSection }> = [
  { label: "Experience", value: "experience" },
  { label: "Summary", value: "summary" },
  { label: "Skills", value: "skills" },
  { label: "Education", value: "education" },
  { label: "General", value: "general" }
];

type RewriteSuggestionCardProps = {
  analysisId: string;
  missingKeywords: string[];
};

type CopyState = {
  index: number | null;
  status: "idle" | "copied" | "error";
};

function getCopyLabel(copyState: CopyState, index: number): string {
  if (copyState.index !== index) {
    return "Copy";
  }

  if (copyState.status === "copied") {
    return "Copied";
  }

  if (copyState.status === "error") {
    return "Retry copy";
  }

  return "Copy";
}

// This conversion-focused card lets users turn one weak bullet into ready-to-use AI rewrite options.
export function RewriteSuggestionCard({ analysisId, missingKeywords }: RewriteSuggestionCardProps) {
  const [section, setSection] = useState<SuggestionSection>("experience");
  const [sourceText, setSourceText] = useState("");
  const [generatedSourceText, setGeneratedSourceText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [suggestions, setSuggestions] = useState<RewriteSuggestion[]>([]);
  const [copyState, setCopyState] = useState<CopyState>({ index: null, status: "idle" });

  const suggestedKeywords = useMemo(() => missingKeywords.slice(0, 6), [missingKeywords]);

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setCopyState({ index: null, status: "idle" });
    setIsLoading(true);

    try {
      const response = await generateRewriteSuggestions({
        analysis_id: analysisId,
        section,
        source_text: sourceText,
        missing_keywords: suggestedKeywords
      });

      setGeneratedSourceText(sourceText.trim());
      setSuggestions(response.suggestions);
    } catch (error) {
      setSuggestions([]);
      setErrorMessage(error instanceof Error ? error.message : "Unable to generate rewrite suggestions.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState({ index, status: "copied" });
    } catch {
      setCopyState({ index, status: "error" });
    }
  }

  return (
    <Panel className="p-6 md:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">AI Rewrite Suggestions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Turn a weak bullet into three stronger versions
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Paste one resume bullet or section, then generate three concise rewrites that naturally include the missing
            keywords surfaced by this analysis.
          </p>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleGenerate}>
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Section type</span>
            <select
              value={section}
              onChange={(event) => setSection(event.target.value as SuggestionSection)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            >
              {SECTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Missing keywords to use</p>
            {suggestedKeywords.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                No missing keywords were surfaced in the current analysis.
              </p>
            )}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Original bullet or section</span>
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Example: Led cross-functional product launches across three markets while coordinating design, engineering, and operations teams."
            className="min-h-36 w-full rounded-3xl border border-slate-300 bg-white px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            required
          />
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Keep the input factual. The rewrite engine improves wording, but it does not invent achievements.
          </p>
          <button
            type="submit"
            disabled={isLoading || suggestedKeywords.length === 0}
            className="rounded-2xl bg-brand-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isLoading ? "Generating..." : "Generate 3 rewrites"}
          </button>
        </div>
      </form>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Original Input</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {generatedSourceText || sourceText.trim() || "Paste a resume bullet or section above to prepare rewrite suggestions."}
          </p>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`loading-${index}`} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
                <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
                </div>
              </div>
            ))
          ) : suggestions.length ? (
            suggestions.map((suggestion, index) => (
              <div key={suggestion.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Rewrite {index + 1}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{suggestion.rationale || "Improved for clarity and fit."}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy(suggestion.suggested_text, index)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
                  >
                    {getCopyLabel(copyState, index)}
                  </button>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{suggestion.suggested_text}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-7 text-slate-500">
              Your three AI rewrite suggestions will appear here after you generate them.
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
