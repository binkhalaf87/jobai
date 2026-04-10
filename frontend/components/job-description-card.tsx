"use client";

import { useState } from "react";

import { Panel } from "@/components/panel";
import { submitJobDescription } from "@/lib/job-descriptions";

type JobDescriptionCardProps = {
  onSaveComplete?: (jobDescriptionId: string) => void;
};

export function JobDescriptionCard({ onSaveComplete }: JobDescriptionCardProps) {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [locationText, setLocationText] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [jobDescriptionId, setJobDescriptionId] = useState("");
  const [normalizedPreview, setNormalizedPreview] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await submitJobDescription({
        title: title.trim() || "Untitled role",
        company_name: companyName.trim() || undefined,
        location_text: locationText.trim() || undefined,
        source_text: sourceText
      });

      setSavedTitle(response.title);
      setJobDescriptionId(response.job_description_id);
      setNormalizedPreview(response.normalized_text_preview);
      onSaveComplete?.(response.job_description_id);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save the job description.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Panel className="p-8">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Job Description</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Paste the target job description</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Save the role details here first. This record is normalized and stored separately so it can feed the later
          analysis flow cleanly.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block md:col-span-1">
            <span className="mb-2 block text-sm font-medium text-slate-700">Role title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
              placeholder="Senior Product Manager"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="mb-2 block text-sm font-medium text-slate-700">Company</span>
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              type="text"
              placeholder="Example Inc."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            />
          </label>
          <label className="block md:col-span-1">
            <span className="mb-2 block text-sm font-medium text-slate-700">Location</span>
            <input
              value={locationText}
              onChange={(event) => setLocationText(event.target.value)}
              type="text"
              placeholder="Remote or Riyadh, Saudi Arabia"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Job description text</span>
          <textarea
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="Paste the full job description here..."
            className="min-h-56 w-full rounded-3xl border border-slate-300 bg-white px-4 py-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
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
            This save step prepares the job description record for future matching and scoring.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Saving..." : "Save job description"}
          </button>
        </div>
      </form>

      {jobDescriptionId ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
          <p className="font-semibold">Job description saved</p>
          <p className="mt-1">Title: {savedTitle}</p>
          <p className="mt-1">Record ID: {jobDescriptionId}</p>
          <p className="mt-3 font-medium">Normalized preview</p>
          <p className="mt-1 whitespace-pre-wrap leading-6">{normalizedPreview || "No preview available."}</p>
        </div>
      ) : null}
    </Panel>
  );
}
