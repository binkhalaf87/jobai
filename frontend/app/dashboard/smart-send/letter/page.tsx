"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { StepBar } from "@/components/smart-send/StepBar";
import { generateLetter, getLetters, saveLetter } from "@/lib/smart-send";
import { getWizard, saveWizard } from "@/lib/wizard";
import { listResumes } from "@/lib/resumes";
import type { ResumeListItem } from "@/types";
import type { UserLetter } from "@/types";

type Mode = "targeted" | "general";

export default function LetterPage() {
  const router = useRouter();
  const t = useTranslations("smartSendPage");
  const [letters, setLetters] = useState<UserLetter[]>([]);
  const [loadingLetters, setLoadingLetters] = useState(true);
  const [resumeName, setResumeName] = useState<string>("");
  const [resumeId, setResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [showResumePicker, setShowResumePicker] = useState(false);

  const [selected, setSelected] = useState<UserLetter | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ subject: string; body: string } | null>(null);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    const w = getWizard();
    setResumeId(w.resume_id ?? "");
    setResumeName(w.resume_name ?? "");
    if (w.subject && w.body) {
      setSelected({ id: "", subject: w.subject, body: w.body, job_title: w.job_title ?? null, company_name: w.company_name ?? null, created_at: "" });
    }
    getLetters()
      .then(setLetters)
      .catch(() => {})
      .finally(() => setLoadingLetters(false));
    listResumes().then((r) => {
      setResumes(r);
      if (!w.resume_id && r.length === 1) {
        setResumeId(r[0].id);
        setResumeName(r[0].source_filename ?? r[0].file_type ?? "سيرة ذاتية");
        saveWizard({ resume_id: r[0].id, resume_name: r[0].source_filename ?? r[0].file_type ?? "سيرة ذاتية" });
      }
    }).catch(() => {});
  }, []);

  async function handleGenerate() {
    if (mode === "targeted" && !jobTitle.trim()) { setGenError(t("letterStep.jobTitleRequired")); return; }
    setGenerating(true); setGenError(""); setGenerated(null);
    try {
      const res = await generateLetter({
        job_title: mode === "general" ? undefined : jobTitle,
        company_name: companyName || undefined,
        job_description: jobDescription || undefined,
        resume_id: resumeId || undefined,
      });
      setGenerated(res);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : t("letterStep.generateFailed"));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSelectGenerated() {
    if (!generated) return;
    try {
      const saved = await saveLetter({
        subject: generated.subject,
        body: generated.body,
        job_title: mode === "targeted" ? jobTitle : undefined,
        company_name: companyName || undefined,
      });
      setSelected(saved);
      setLetters((prev) => [saved, ...prev]);
    } catch {
      // Save failed — still allow selection without backend save
      setSelected({ id: "", subject: generated.subject, body: generated.body, job_title: jobTitle || null, company_name: companyName || null, created_at: "" });
    }
    setShowForm(false);
  }

  function handleSelectFromHistory(letter: UserLetter) {
    setSelected(letter);
  }

  function handleNext() {
    if (!selected) return;
    saveWizard({ subject: selected.subject, body: selected.body, job_title: selected.job_title ?? "", company_name: selected.company_name ?? "" });
    router.push("/dashboard/smart-send/preview");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={4} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">{t("letterStep.title")}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {resumeName ? t("letterStep.descriptionWithResume", { resumeName }) : t("letterStep.descriptionGeneric")}
        </p>
      </div>

      {/* Resume selector */}
      {resumes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>📄</span>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{t("resumeStep.title")}</p>
            </div>
            <button onClick={() => setShowResumePicker((v) => !v)} className="text-xs text-brand-600 hover:underline">
              {resumeName ? t("previewStep.editLabel") : t("resumeStep.uploadBtn")}
            </button>
          </div>
          {resumeName ? (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="w-5 h-5 bg-teal rounded-full flex items-center justify-center text-white text-[10px] font-bold">✓</span>
              <span className="truncate">{resumeName}</span>
            </div>
          ) : (
            <p className="text-xs text-amber-600">{t("resumeStep.noResumes")}</p>
          )}
          {showResumePicker && (
            <div className="space-y-2 pt-1">
              {resumes.map((resume) => (
                <button
                  key={resume.id}
                  onClick={() => {
                    const name = resume.source_filename ?? resume.file_type ?? "سيرة ذاتية";
                    setResumeId(resume.id);
                    setResumeName(name);
                    saveWizard({ resume_id: resume.id, resume_name: name });
                    setShowResumePicker(false);
                  }}
                  className={`w-full text-right rounded-lg border p-3 flex items-center gap-2 transition-all text-sm ${resumeId === resume.id ? "border-brand-500 bg-brand-50 ring-1 ring-brand-300" : "border-slate-200 hover:border-brand-200"}`}
                >
                  <span className="text-base">📄</span>
                  <span className="truncate font-medium text-slate-800">{resume.source_filename ?? `سيرة ذاتية.${resume.file_type}`}</span>
                  <span className="text-xs text-slate-400 uppercase mr-auto flex-shrink-0">{resume.file_type}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New letter form toggle */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-brand-300 rounded-xl py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors flex items-center justify-center gap-2"
        >
          {t("letterStep.newLetterBtn")}
        </button>
      )}

      {/* Generate form */}
      {showForm && (
        <div className="border border-brand-200 rounded-xl p-5 bg-brand-50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-800">{t("letterStep.formTitle")}</h3>
            <button onClick={() => { setShowForm(false); setGenerated(null); setGenError(""); }} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          </div>

          {resumeName && (
            <div className="rounded-lg bg-teal-light/20 border border-teal-light px-3 py-2 text-xs text-teal flex items-center gap-2">
              <span>📄</span>
              <span>{t("letterStep.resumeHint", { resumeName })}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("general")} className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${mode === "general" ? "bg-brand-800 text-white border-brand-800" : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"}`}>
              {t("letterStep.modeGeneral")}
            </button>
            <button onClick={() => setMode("targeted")} className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${mode === "targeted" ? "bg-brand-800 text-white border-brand-800" : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"}`}>
              {t("letterStep.modeTargeted")}
            </button>
          </div>

          {mode === "targeted" && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-brand-700">{t("letterStep.jobTitle")} <span className="text-rose-500">*</span></label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="مثال: مهندس برمجيات" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-brand-700">{t("letterStep.companyName")} <span className="text-slate-400 font-normal">{t("letterStep.optional")}</span></label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="مثال: شركة أرامكو" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-brand-700">{t("letterStep.jobDescription")} <span className="text-slate-400 font-normal">{t("letterStep.optional")}</span></label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder={t("letterStep.jobDescPlaceholder")} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </>
          )}

          {mode === "general" && (
            <div className="rounded-lg bg-white border border-brand-100 px-3 py-2 text-xs text-slate-500">
              {t("letterStep.generalHint")}
            </div>
          )}

          {genError && <p className="text-rose-600 text-xs">{genError}</p>}

          {!generated ? (
            <button onClick={handleGenerate} disabled={generating} className="w-full bg-brand-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {generating ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("letterStep.generating")}</>
              ) : t("letterStep.generateBtn")}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-700">{t("letterStep.subjectLabel")}</p>
                <p className="text-sm text-slate-800">{generated.subject}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2">{t("letterStep.bodyLabel")}</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-5">{generated.body}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => void handleSelectGenerated()} className="flex-1 bg-teal text-white rounded-lg py-2 text-sm font-semibold hover:bg-teal/90">
                  {t("letterStep.selectThis")}
                </button>
                <button onClick={handleGenerate} disabled={generating} className="flex-1 border border-brand-200 text-brand-700 rounded-lg py-2 text-sm font-semibold hover:bg-brand-50 disabled:opacity-50">
                  {generating ? t("letterStep.regenerating") : t("letterStep.regenerate")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved letters */}
      {loadingLetters ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : letters.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("letterStep.savedLetters")}</p>
          {letters.map((letter) => {
            const isSelected = selected?.id === letter.id;
            return (
              <button
                key={letter.id}
                onClick={() => handleSelectFromHistory(letter)}
                className={`w-full text-right rounded-xl border p-4 transition-all hover:shadow-sm ${isSelected ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300" : "border-slate-200 bg-white hover:border-brand-200"}`}
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{letter.subject}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {letter.job_title && <span>{letter.job_title}</span>}
                  {letter.job_title && letter.company_name && <span> — </span>}
                  {letter.company_name && <span>{letter.company_name}</span>}
                  {!letter.job_title && !letter.company_name && <span className="italic">{t("letterStep.generalTag")}</span>}
                </p>
              </button>
            );
          })}
        </div>
      ) : !showForm ? (
        <p className="text-center text-sm text-slate-400 py-4">{t("letterStep.noSavedLetters")}</p>
      ) : null}

      {/* Selected preview */}
      {selected && (
        <div className="rounded-xl border border-teal-light bg-teal-light/10 p-4 flex items-start gap-3">
          <div className="w-5 h-5 bg-teal rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">✓</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-teal">{t("letterStep.selectedTitle")}</p>
            <p className="text-xs text-slate-600 truncate mt-0.5">{selected.subject}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/smart-send/settings" className="text-sm text-slate-500 hover:text-slate-700">{t("wizard.back")}</Link>
        <button
          onClick={handleNext}
          disabled={!selected}
          className="bg-brand-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("wizard.next")}
        </button>
      </div>
    </main>
  );
}
