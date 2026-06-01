"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && "Sentry" in window) {
      (window as { Sentry?: { captureException: (e: unknown) => void } }).Sentry?.captureException(error);
    }
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">حدث خطأ غير متوقع</h2>
          <p className="text-slate-500 text-sm mb-6">نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى.</p>
          <button
            onClick={reset}
            className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            حاول مرة أخرى
          </button>
        </div>
      </body>
    </html>
  );
}
