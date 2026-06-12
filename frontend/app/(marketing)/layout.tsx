import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

import { SiteHeader } from "@/components/site-header";

async function SiteFooter() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const t = {
    tagline: isAr ? "ذكاء اصطناعي يحوّل سيرتك إلى بوابة فرصك" : "AI-powered tools that turn your resume into your biggest career advantage",
    product: {
      label: isAr ? "المنتج" : "Product",
      links: isAr
        ? [
            { label: "كيف يعمل JobAI", href: "/#how-it-works" },
            { label: "المميزات", href: "/#features" },
            { label: "للشركات والـ HR", href: "/register?role=recruiter" },
            { label: "الأسعار", href: "/pricing" },
          ]
        : [
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Features", href: "/#features" },
            { label: "For HR Teams", href: "/register?role=recruiter" },
            { label: "Pricing", href: "/pricing" },
          ],
    },
    company: {
      label: isAr ? "الشركة" : "Company",
      links: isAr
        ? [
            { label: "من نحن", href: "/about" },
            { label: "سياسة الخصوصية", href: "/privacy" },
            { label: "شروط الاستخدام", href: "/terms" },
            { label: "تواصل معنا", href: "mailto:hello@jobai24.com" },
          ]
        : [
            { label: "About Us", href: "/about" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Contact Us", href: "mailto:hello@jobai24.com" },
          ],
    },
    forUsers: {
      label: isAr ? "للمستخدمين" : "For Users",
      links: isAr
        ? [
            { label: "إنشاء حساب مجاني", href: "/register" },
            { label: "تسجيل الدخول", href: "/login" },
            { label: "للشركات — جرّب مجاناً", href: "/register?role=recruiter" },
          ]
        : [
            { label: "Create Free Account", href: "/register" },
            { label: "Sign In", href: "/login" },
            { label: "For Companies — Try Free", href: "/register?role=recruiter" },
          ],
    },
    copyright: isAr ? "© ٢٠٢٥ JobAI24. جميع الحقوق محفوظة." : "© 2025 JobAI24. All rights reserved.",
    madeIn: isAr ? "صُنع بشغف في المملكة العربية السعودية 🇸🇦" : "Made with passion in Saudi Arabia 🇸🇦",
  };

  return (
    <footer className="border-t border-slate-200/80 bg-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-black text-white tracking-tight">
              JobAI
            </Link>
            <p className="mt-3 text-sm text-slate-400 leading-relaxed max-w-[200px]">{t.tagline}</p>
            <div className="mt-5 flex gap-3">
              <a
                href="mailto:hello@jobai24.com"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-brand-600/30 hover:text-brand-400 transition-colors"
                aria-label="Email"
              >
                <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{t.product.label}</h3>
            <ul className="space-y-3">
              {t.product.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{t.company.label}</h3>
            <ul className="space-y-3">
              {t.company.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">{t.forUsers.label}</h3>
            <ul className="space-y-3">
              {t.forUsers.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-slate-500">{t.copyright}</p>
          <p className="text-xs text-slate-500">{t.madeIn}</p>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
