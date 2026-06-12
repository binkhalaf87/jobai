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
            { label: "للشركات والـ HR", href: "/for-hr" },
            { label: "الأسعار", href: "/pricing" },
            { label: "المدونة", href: "/blog" },
          ]
        : [
            { label: "How It Works", href: "/#how-it-works" },
            { label: "Features", href: "/#features" },
            { label: "For HR Teams", href: "/for-hr" },
            { label: "Pricing", href: "/pricing" },
            { label: "Blog", href: "/blog" },
          ],
    },
    company: {
      label: isAr ? "الشركة" : "Company",
      links: isAr
        ? [
            { label: "من نحن", href: "/about" },
            { label: "سياسة الخصوصية", href: "/privacy" },
            { label: "شروط الاستخدام", href: "/terms" },
            { label: "سياسة ملفات الارتباط", href: "/cookies" },
            { label: "تواصل معنا", href: "mailto:hello@jobai24.com" },
          ]
        : [
            { label: "About Us", href: "/about" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Cookie Policy", href: "/cookies" },
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
              {/* Social placeholders — point to real profiles once created */}
              <a
                href="https://www.linkedin.com/company/jobai24"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-brand-600/30 hover:text-brand-400 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 110-4.13 2.07 2.07 0 010 4.13zM7.12 20.45H3.55V9h3.57v11.45z"/></svg>
              </a>
              <a
                href="https://x.com/jobai24"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-brand-600/30 hover:text-brand-400 transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"/></svg>
              </a>
              <a
                href="https://www.instagram.com/jobai24"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-brand-600/30 hover:text-brand-400 transition-colors"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 01-1.38-.9c-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.88 5.88 0 00-2.13 1.38A5.88 5.88 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.81.72 1.49 1.38 2.13a5.88 5.88 0 002.13 1.38c.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 002.13-1.38 5.88 5.88 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 00-1.38-2.13A5.88 5.88 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1018.16 12 6.16 6.16 0 0012 5.84zm0 10.15A4 4 0 1116 12a4 4 0 01-4 4zm7.85-10.4a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>
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
