import type { ReactNode } from "react";
import Link from "next/link";
import { getLocale } from "next-intl/server";

import { SiteHeader } from "@/components/site-header";

async function SiteFooter() {
  const locale = await getLocale();
  const isAr = locale === "ar";

  const t = {
    tagline: isAr ? "منصة التوظيف الذكي رقم ١ في الخليج العربي" : "The #1 AI-Powered Hiring Platform for Saudi Arabia & GCC",
    product: {
      label: isAr ? "المنتج" : "Product",
      links: isAr
        ? [
            { label: "كيف يعمل JobAI", href: "#how-it-works" },
            { label: "المميزات", href: "#features" },
            { label: "للشركات والـ HR", href: "#for-recruiters" },
            { label: "الأسعار", href: "#pricing" },
          ]
        : [
            { label: "How It Works", href: "#how-it-works" },
            { label: "Features", href: "#features" },
            { label: "For HR Teams", href: "#for-recruiters" },
            { label: "Pricing", href: "#pricing" },
          ],
    },
    company: {
      label: isAr ? "الشركة" : "Company",
      links: isAr
        ? [
            { label: "سياسة الخصوصية", href: "/privacy" },
            { label: "شروط الاستخدام", href: "/terms" },
            { label: "تواصل معنا", href: "mailto:hello@jobai.sa" },
          ]
        : [
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
            { label: "Contact Us", href: "mailto:hello@jobai.sa" },
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
                href="https://wa.me/966500000000"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-green-600/30 hover:text-green-400 transition-colors"
                aria-label="WhatsApp"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a
                href="mailto:hello@jobai.sa"
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
