import Link from "next/link";
import { getLocale } from "next-intl/server";

import { PageContainer } from "@/components/page-container";
import { LocaleSwitcher } from "@/components/locale-switcher";

export async function SiteHeader() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const t = {
    logoTagline: isAr ? "التوظيف بالذكاء الاصطناعي" : "AI-Powered Hiring",
    nav: isAr
      ? [
          { label: "كيف يعمل", href: "/#how-it-works" },
          { label: "المميزات", href: "/#features" },
          { label: "للشركات", href: "/#for-recruiters" },
          { label: "الأسعار", href: "/#pricing" },
        ]
      : [
          { label: "How It Works", href: "/#how-it-works" },
          { label: "Features", href: "/#features" },
          { label: "For HR Teams", href: "/#for-recruiters" },
          { label: "Pricing", href: "/#pricing" },
        ],
    login: isAr ? "تسجيل الدخول" : "Sign In",
    cta: isAr ? "ابدأ مجاناً" : "Start Free",
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/95 backdrop-blur-md">
      <PageContainer className="flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 16 16">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.75 2.5v3.25l2.75 1.5-.5.87L6.5 9.5V5.5h.75z" />
            </svg>
          </div>
          <span className="text-base font-black tracking-tight text-slate-950">JobAI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex flex-1 justify-center">
          {t.nav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Link
            href="/login"
            className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 md:inline-flex"
          >
            {t.login}
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200/50"
          >
            {t.cta}
          </Link>
        </div>
      </PageContainer>
    </header>
  );
}
