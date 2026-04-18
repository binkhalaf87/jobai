"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { login, register } from "@/lib/auth";
import { setUserRole } from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "register";
};


export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const t = useTranslations("auth");
  const f = useTranslations("auth.fields");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"jobseeker" | "recruiter">("jobseeker");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const ns = isRegister ? "register" : "login";

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
        const loggedInRole = response.user.role;
        setUserRole(loggedInRole);
        router.push(loggedInRole === "recruiter" ? "/recruiter" : "/dashboard");
      }

      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("email") || msg.includes("taken")) {
        setErrorMessage(t("errors.emailTaken"));
      } else {
        setErrorMessage(t("errors.authFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
        {t(`${ns}.eyebrow`)}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t(`${ns}.title`)}</h1>
      <p className="text-sm leading-6 text-slate-600">{t(`${ns}.description`)}</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        {isRegister ? (
          <>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">{f("fullName")}</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                type="text"
                placeholder={f("fullNamePlaceholder")}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">{f("roleLabel")}</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("jobseeker")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    role === "jobseeker"
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {f("jobseeker")}
                </button>
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    role === "recruiter"
                      ? "border-brand-800 bg-brand-800 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {f("recruiter")}
                </button>
              </div>
            </div>
          </>
        ) : null}

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">{f("email")}</span>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            placeholder={f("emailPlaceholder")}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700">{f("password")}</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder={f("passwordPlaceholder")}
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
          className="w-full rounded-2xl bg-brand-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? t(`${ns}.submitting`) : t(`${ns}.submit`)}
        </button>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <Link href="/" className="font-medium text-slate-700 hover:text-slate-950">
          {t(`${ns}.backHome`)}
        </Link>
        {isRegister ? (
          <Link href="/login" className="font-medium text-slate-700 hover:text-slate-950">
            {t("register.hasAccount")}
          </Link>
        ) : (
          <Link href="/register" className="font-medium text-slate-700 hover:text-slate-950">
            {t("login.noAccount")}
          </Link>
        )}
      </div>
    </div>
  );
}
