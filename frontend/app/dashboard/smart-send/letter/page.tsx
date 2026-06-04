"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepBar } from "@/components/smart-send/StepBar";
import { generateLetter, getHistory } from "@/lib/smart-send";
import { getWizard, saveWizard } from "@/lib/wizard";
import type { SendHistoryItem } from "@/types";

type Mode = "targeted" | "general";

export default function LetterPage() {
  const router = useRouter();
  const [history, setHistory] = useState<SendHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Selected letter (from history or generated)
  const [selected, setSelected] = useState<{ subject: string; body: string; job_title: string; company_name: string } | null>(null);

  // New letter form
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<Mode>("general");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ subject: string; body: string } | null>(null);
  const [genError, setGenError] = useState("");

  // Load history and restore wizard state
  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
    const w = getWizard();
    if (w.subject && w.body) {
      setSelected({ subject: w.subject, body: w.body, job_title: w.job_title ?? "", company_name: w.company_name ?? "" });
    }
  }, []);

  async function handleGenerate() {
    if (mode === "targeted" && !jobTitle.trim()) { setGenError("يرجى إدخال المسمى الوظيفي"); return; }
    setGenerating(true); setGenError(""); setGenerated(null);
    try {
      const res = await generateLetter({
        job_title: mode === "general" ? undefined : jobTitle,
        company_name: companyName || undefined,
        job_description: jobDescription || undefined,
      });
      setGenerated(res);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "فشل توليد الخطاب");
    } finally {
      setGenerating(false);
    }
  }

  function handleSelectGenerated() {
    if (!generated) return;
    setSelected({ subject: generated.subject, body: generated.body, job_title: jobTitle, company_name: companyName });
    setShowForm(false);
  }

  function handleNext() {
    if (!selected) return;
    saveWizard({ subject: selected.subject, body: selected.body, job_title: selected.job_title, company_name: selected.company_name });
    router.push("/dashboard/smart-send/resume");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={1} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">اختر الخطاب</h1>
        <p className="text-sm text-slate-500 mt-1">اختر خطاباً من سجلك السابق أو أنشئ خطاباً جديداً</p>
      </div>

      {/* New letter form toggle */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full border-2 border-dashed border-brand-300 rounded-xl py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> توليد خطاب جديد
        </button>
      )}

      {/* Generate form */}
      {showForm && (
        <div className="border border-brand-200 rounded-xl p-5 bg-brand-50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-800">توليد خطاب جديد</h3>
            <button onClick={() => { setShowForm(false); setGenerated(null); setGenError(""); }} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
          </div>

          {/* Mode selector */}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setMode("general")} className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${mode === "general" ? "bg-brand-800 text-white border-brand-800" : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"}`}>
              خطاب عام
            </button>
            <button onClick={() => setMode("targeted")} className={`rounded-lg border py-2.5 text-xs font-semibold transition-colors ${mode === "targeted" ? "bg-brand-800 text-white border-brand-800" : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"}`}>
              موجّه لوظيفة
            </button>
          </div>

          {mode === "targeted" && (
            <>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-brand-700">المسمى الوظيفي <span className="text-rose-500">*</span></label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="مثال: مهندس برمجيات" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-brand-700">اسم الشركة <span className="text-slate-400 font-normal">(اختياري)</span></label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="مثال: شركة أرامكو" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-brand-700">وصف الوظيفة <span className="text-slate-400 font-normal">(اختياري)</span></label>
                <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="الصق وصف الوظيفة هنا..." rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
              </div>
            </>
          )}

          {mode === "general" && (
            <div className="rounded-lg bg-white border border-brand-100 px-3 py-2 text-xs text-slate-500">
              سيتم توليد خطاب تقديم عام مناسب للإرسال لأي شركة
            </div>
          )}

          {genError && <p className="text-rose-600 text-xs">{genError}</p>}

          {!generated ? (
            <button onClick={handleGenerate} disabled={generating} className="w-full bg-brand-800 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2">
              {generating ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جارٍ التوليد...</>
              ) : "توليد الخطاب"}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-700">الموضوع:</p>
                <p className="text-sm text-slate-800">{generated.subject}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2">نص الخطاب:</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4">{generated.body}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSelectGenerated} className="flex-1 bg-teal text-white rounded-lg py-2 text-sm font-semibold hover:bg-teal/90">
                  اختر هذا الخطاب
                </button>
                <button onClick={handleGenerate} disabled={generating} className="flex-1 border border-brand-200 text-brand-700 rounded-lg py-2 text-sm font-semibold hover:bg-brand-50 disabled:opacity-50">
                  {generating ? "جارٍ إعادة التوليد..." : "توليد مرة أخرى"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {loadingHistory ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">خطابات سابقة</p>
          {history.map((item) => {
            const isSelected = selected?.subject === item.subject && selected?.body === item.body;
            return (
              <button
                key={item.id}
                onClick={() => setSelected({ subject: item.subject, body: item.body, job_title: item.job_title ?? "", company_name: item.company_name ?? "" })}
                className={`w-full text-right rounded-xl border p-4 transition-all hover:shadow-sm ${isSelected ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300" : "border-slate-200 bg-white hover:border-brand-200"}`}
              >
                <p className="text-sm font-semibold text-slate-800 truncate">{item.subject}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {item.job_title && <span>{item.job_title}</span>}
                  {item.job_title && item.company_name && <span> — </span>}
                  {item.company_name && <span>{item.company_name}</span>}
                </p>
              </button>
            );
          })}
        </div>
      ) : !showForm ? (
        <p className="text-center text-sm text-slate-400 py-4">لا توجد خطابات سابقة — أنشئ خطاباً جديداً أعلاه</p>
      ) : null}

      {/* Selected preview */}
      {selected && (
        <div className="rounded-xl border border-teal-light bg-teal-light/10 p-4 flex items-start gap-3">
          <div className="w-5 h-5 bg-teal rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">✓</div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-teal">تم اختيار الخطاب</p>
            <p className="text-xs text-slate-600 truncate mt-0.5">{selected.subject}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/smart-send" className="text-sm text-slate-500 hover:text-slate-700">← العودة</Link>
        <button
          onClick={handleNext}
          disabled={!selected}
          className="bg-brand-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          التالي ←
        </button>
      </div>
    </main>
  );
}
