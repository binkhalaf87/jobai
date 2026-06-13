"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { login, register } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { getRequiredPublicApiUrl } from "@/lib/config";

type AuthFormProps = {
  mode: "login" | "register";
  googleError?: boolean;
};

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[!@#$%^&*()\-_=+\[\]{};:'",.<>?/\\|`~]/.test(pw)) score++;
  const labels = ["Very Weak", "Weak", "Fair", "Strong"];
  const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  return { score, label: labels[score - 1] ?? "Very Weak", color: colors[score - 1] ?? "bg-red-500" };
}


export function AuthForm({ mode, googleError }: AuthFormProps) {
  const router = useRouter();
  const t = useTranslations("auth");
  const f = useTranslations("auth.fields");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"jobseeker" | "recruiter">("jobseeker");
  const [errorMessage, setErrorMessage] = useState(googleError ? t("errors.googleAuthFailed") : "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const ns = isRegister ? "register" : "login";
  const strength = getPasswordStrength(password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({ email, password, full_name: fullName || undefined, role });
        router.push(`/check-email?email=${encodeURIComponent(email)}`);
      } else {
        const response = await login({ email, password });
        const loggedInRole = response.user.role;
        router.push(
          loggedInRole === "recruiter" ? "/recruiter" : loggedInRole === "admin" ? "/admin" : "/dashboard"
        );
        router.refresh();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        const detail = error.detail?.toLowerCase() ?? "";
        if (detail.includes("google_account_no_password")) {
          setErrorMessage(t("errors.googleAccountNoPassword"));
        } else if (detail.includes("already exists") || detail.includes("email taken")) {
          setErrorMessage(t("errors.emailTaken"));
        } else if (detail.includes("not verified") || detail.includes("verify") || detail.includes("confirm")) {
          setErrorMessage(t("errors.emailNotVerified"));
        } else if (error.status >= 500) {
          setErrorMessage(t("errors.serverError"));
        } else {
          setErrorMessage(t("errors.authFailed"));
        }
      } else {
        setErrorMessage(t("errors.serverError"));
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

      <div className="mt-8">
        <a
          href={`${getRequiredPublicApiUrl()}/auth/google`}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          {t("googleButton")}
        </a>

        <div className="my-5 flex items-center gap-3">
          <hr className="flex-1 border-slate-200" />
          <span className="text-xs text-slate-400">{t("orContinueWith")}</span>
          <hr className="flex-1 border-slate-200" />
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed select-none">
                  {f("recruiter")}
                  <span className="absolute -top-2 -right-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white leading-none">
                    {f("comingSoon")}
                  </span>
                </div>
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

        <div>
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
          {isRegister && password ? (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength.score ? strength.color : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">{strength.label}</p>
            </div>
          ) : null}
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <p>{errorMessage}</p>
          </div>
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
        <Link href="/" prefetch={false} className="font-medium text-slate-700 hover:text-slate-950">
          {t(`${ns}.backHome`)}
        </Link>
        {isRegister ? (
          <Link href="/login" prefetch={false} className="font-medium text-slate-700 hover:text-slate-950">
            {t("register.hasAccount")}
          </Link>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <Link href="/forgot-password" prefetch={false} className="font-medium text-slate-700 hover:text-slate-950">
              Forgot password?
            </Link>
            <Link href="/register" prefetch={false} className="font-medium text-slate-700 hover:text-slate-950">
              {t("login.noAccount")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
