"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepBar } from "@/components/smart-send/StepBar";
import { listResumes } from "@/lib/resumes";
import { getWizard, saveWizard } from "@/lib/wizard";
import type { ResumeListItem } from "@/types";

export default function ResumePage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    listResumes()
      .then(setResumes)
      .catch(() => {})
      .finally(() => setLoading(false));
    const w = getWizard();
    if (w.resume_id) setSelectedId(w.resume_id);
  }, []);

  function handleNext() {
    const resume = resumes.find((r) => r.id === selectedId);
    saveWizard({ resume_id: selectedId, resume_name: resume?.source_filename ?? resume?.file_type ?? "سيرة ذاتية" });
    router.push("/dashboard/smart-send/list");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <StepBar current={2} />

      <div>
        <h1 className="text-xl font-bold text-slate-800">اختر السيرة الذاتية</h1>
        <p className="text-sm text-slate-500 mt-1">ستُرفق السيرة الذاتية مع كل رسالة في الحملة</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : resumes.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center space-y-3">
          <p className="text-sm text-amber-800 font-semibold">لا توجد سيرة ذاتية مرفوعة</p>
          <p className="text-xs text-amber-700">يجب رفع سيرة ذاتية قبل إطلاق الحملة</p>
          <Link href="/dashboard/resume" className="inline-block bg-brand-800 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-brand-700">
            رفع سيرة ذاتية
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {resumes.map((resume) => (
            <button
              key={resume.id}
              onClick={() => setSelectedId(resume.id)}
              className={`w-full text-right rounded-xl border p-4 flex items-center gap-3 transition-all hover:shadow-sm ${selectedId === resume.id ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300" : "border-slate-200 bg-white hover:border-brand-200"}`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${selectedId === resume.id ? "bg-brand-100" : "bg-slate-100"}`}>
                📄
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{resume.source_filename ?? `سيرة ذاتية.${resume.file_type}`}</p>
                <p className="text-xs text-slate-500 mt-0.5 uppercase">{resume.file_type}</p>
              </div>
              {selectedId === resume.id && (
                <div className="w-5 h-5 bg-brand-800 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</div>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Link href="/dashboard/smart-send/letter" className="text-sm text-slate-500 hover:text-slate-700">← العودة</Link>
        <button
          onClick={handleNext}
          disabled={!selectedId}
          className="bg-brand-800 text-white rounded-xl px-6 py-2.5 text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          التالي ←
        </button>
      </div>
    </main>
  );
}
