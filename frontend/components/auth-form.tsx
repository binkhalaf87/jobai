"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { login, register, resendVerification } from "@/lib/auth";
import { ApiError } from "@/lib/api";

type AuthFormProps = {
  mode: "login" | "register";
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


export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const t = useTranslations("auth");
  const f = useTranslations("auth.fields");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"jobseeker" | "recruiter">("jobseeker");
  const [errorMessage, setErrorMessage] = useState("");
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === "register";
  const ns = isRegister ? "register" : "login";
  const strength = getPasswordStrength(password);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setShowResendButton(false);
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
        if (error.detail === "email_not_verified") {
          setErrorMessage("Please verify your email address before logging in.");
          setShowResendButton(true);
          setResendEmail(email);
        } else if (error.detail?.includes("already exists")) {
          setErrorMessage(t("errors.emailTaken"));
        } else {
          setErrorMessage(error.detail || t("errors.authFailed"));
        }
      } else {
        const msg = error instanceof Error ? error.message : "";
        setErrorMessage(msg || t("errors.authFailed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setResendStatus("Sending...");
    try {
      await resendVerification(resendEmail);
      setResendStatus("Verification email sent. Check your inbox.");
    } catch {
      setResendStatus("Failed to resend. Try again later.");
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
            {showResendButton ? (
              <button
                type="button"
                onClick={handleResend}
                className="mt-2 font-semibold underline"
              >
                Resend verification email
              </button>
            ) : null}
            {resendStatus ? <p className="mt-1 text-rose-600">{resendStatus}</p> : null}
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
        <Link href="/" className="font-medium text-slate-700 hover:text-slate-950">
          {t(`${ns}.backHome`)}
        </Link>
        {isRegister ? (
          <Link href="/login" className="font-medium text-slate-700 hover:text-slate-950">
            {t("register.hasAccount")}
          </Link>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <Link href="/forgot-password" className="font-medium text-slate-700 hover:text-slate-950">
              Forgot password?
            </Link>
            <Link href="/register" className="font-medium text-slate-700 hover:text-slate-950">
              {t("login.noAccount")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
