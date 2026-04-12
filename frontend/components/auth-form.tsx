"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { login, register } from "@/lib/auth";
import { setUserRole } from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "register";
};


export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"jobseeker" | "recruiter">("jobseeker");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const title = isRegister ? "Create your account" : "Sign in to JobAI";
  const description = isRegister
    ? "Create a starter account to access the dashboard shell."
    : "Use your account credentials to access the protected dashboard.";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const response = await register({
          email,
          password,
          full_name: fullName || undefined,
          role,
        });
        const registeredRole = response.user.role;
        setUserRole(registeredRole);
        router.push(registeredRole === "recruiter" ? "/recruiter" : "/dashboard");
      } else {
        const response = await login({ email, password });
        const role = response.user.role;
        setUserRole(role);
        router.push(role === "recruiter" ? "/recruiter" : "/dashboard");
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
        {isRegister ? "Create Account" : "Account Access"}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
      <p className="text-sm leading-6 text-slate-600">{description}</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        {isRegister ? (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                type="text"
                placeholder="Jane Doe"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">I am a</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("jobseeker")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    role === "jobseeker"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  🎯 Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    role === "recruiter"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  🏢 Recruiter
                </button>
              </div>
            </div>
          </>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            required
          />
        </label>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? "Please wait..." : isRegister ? "Create account" : "Continue"}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <Link href="/" className="font-medium text-slate-700 hover:text-slate-950">
          Back home
        </Link>
        {isRegister ? (
          <Link href="/login" className="font-medium text-slate-700 hover:text-slate-950">
            Already have an account?
          </Link>
        ) : (
          <Link href="/register" className="font-medium text-slate-700 hover:text-slate-950">
            Create an account
          </Link>
        )}
      </div>
    </div>
  );
}
