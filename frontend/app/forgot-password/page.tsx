"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPassword } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
    } catch {
      // Always show success to prevent email enumeration
    } finally {
      setSubmitted(true);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        {submitted ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
              <svg className="h-8 w-8 text-brand-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-semibold text-slate-950">Check your email</h1>
            <p className="mb-6 text-sm text-slate-600">
              If that email is registered, we&apos;ve sent a password reset link. The link expires in 1 hour.
            </p>
            <Link href="/login" className="text-sm font-medium text-brand-800 hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Account recovery</p>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight text-slate-950">Forgot password?</h1>
            <p className="mb-8 text-sm leading-6 text-slate-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              <Link href="/login" className="font-medium text-slate-700 hover:text-slate-950">
                Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
