"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resendVerification } from "@/lib/auth";

function CheckEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    if (!email) return;
    setStatus("sending");
    try {
      const result = await resendVerification(email);
      setStatus(result.sent ? "sent" : "idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <svg className="h-8 w-8 text-brand-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-slate-950">Check your email</h1>
        <p className="mb-1 text-sm text-slate-600">
          We sent a verification link to
        </p>
        {email ? (
          <p className="mb-6 text-sm font-semibold text-slate-900">{email}</p>
        ) : (
          <p className="mb-6 text-sm text-slate-600">your email address.</p>
        )}
        <p className="mb-8 text-xs text-slate-500">The link expires in 24 hours. Check your spam folder if you don&apos;t see it.</p>

        {email ? (
          <div className="space-y-3">
            {status === "sent" ? (
              <p className="text-sm text-green-700">A new link has been sent.</p>
            ) : status === "error" ? (
              <p className="text-sm text-rose-700">Failed to resend. Try again later.</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={status === "sending"}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "sending" ? "Sending..." : "Resend verification email"}
              </button>
            )}
          </div>
        ) : null}

        <p className="mt-6 text-sm text-slate-500">
          <Link href="/login" className="font-medium text-slate-700 hover:text-slate-950">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense>
      <CheckEmailContent />
    </Suspense>
  );
}
