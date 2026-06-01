"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RecruiterError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Recruiter error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-2">حدث خطأ في هذه الصفحة</h2>
      <p className="text-slate-500 text-sm mb-6 text-center max-w-xs">
        تعذّر تحميل هذا القسم. يمكنك المحاولة مرة أخرى.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          حاول مرة أخرى
        </button>
        <a
          href="/recruiter"
          className="py-2 px-4 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}
