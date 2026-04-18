"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/hooks/use-auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DASHBOARD_NAV_GROUPS } from "@/lib/navigation";

function NavIcon({ id }: { id: string }) {
  const icons: Record<string, ReactNode> = {
    home: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    "file-text": (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </>
    ),
    "bar-chart": (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
    sparkles: (
      <>
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
        <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
        <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
      </>
    ),
    mic: (
      <>
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
    send: (
      <>
        <line x1="22" y1="2" x2="11" y2="13" />
        <polygon points="22 2 15 22 11 13 2 9 22 2" />
      </>
    ),
    star: (
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    ),
    user: (
      <>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    "credit-card": (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </>
    ),
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[id] ?? null}
    </svg>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type DashboardLayoutShellProps = { children: ReactNode };

export function DashboardLayoutShell({ children }: DashboardLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasSession, signOut } = useAuth();
  const t = useTranslations("nav");

  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const allItems = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items);
  const currentItem = allItems.find((item) => isActive(pathname, item.href));
  const currentKey = currentItem?.key ?? "dashboard";
  const currentLabel = currentItem ? t(`items.${currentItem.key}`) : t("items.dashboard");

  useEffect(() => {
    if (!isLoading && !hasSession) router.replace("/login");
  }, [hasSession, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#EEF2F9_55%,_#f8fafc)]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{t("groups.workspace")}</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{t("items.dashboard")}…</h1>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const accountItems = DASHBOARD_NAV_GROUPS.find((group) => group.key === "account")?.items ?? [];

  const initials = (user.full_name ?? user.email)
    .split(" ")
    .slice(0, 2)
    .map((segment: string) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_#ffffff,_#f8fafc_45%,_#EEF2F9_100%)] text-slate-900">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur md:flex md:flex-col">
        {/* Logo */}
        <div className="px-5 py-5">
          <Link href="/dashboard" className="inline-flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-sm font-bold text-white shadow-md shadow-brand-800/30">
              J
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-teal" />
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">JobAI</p>
              <p className="text-[10px] font-medium leading-none text-slate-400">{t("brandTagline")}</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {DASHBOARD_NAV_GROUPS.filter((group) => group.key !== "account").map((group) => (
            <div key={group.key} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                {t(`groups.${group.key}`)}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                          active
                            ? "bg-brand-800 text-white shadow-sm shadow-brand-800/20"
                            : "text-slate-600 hover:bg-brand-50 hover:text-brand-800"
                        }`}
                      >
                        {active && (
                          <span className="absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-teal" />
                        )}
                        {item.icon && <NavIcon id={item.icon} />}
                        <span>{t(`items.${item.key}`)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Account */}
        <div className="border-t border-slate-100 p-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountMenu((current) => !current)}
              className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-brand-200 hover:bg-brand-50"
              aria-expanded={showAccountMenu}
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user.full_name ?? user.email}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-slate-400">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showAccountMenu ? (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="p-2">
                  {accountItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowAccountMenu(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-800"
                    >
                      {item.icon && <NavIcon id={item.icon} />}
                      <span>{t(`items.${item.key}`)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => { signOut(); router.replace("/login"); }}
            className="mt-2 w-full rounded-xl px-3 py-2 text-right text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {t("user.signOut")}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
          <div className="px-5 py-4 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">{t("groups.workspace")}</p>
                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
                  {currentLabel}
                </h1>
              </div>
              <LocaleSwitcher />
            </div>
          </div>

          {/* Mobile nav pills */}
          <div className="border-t border-slate-100 px-5 py-2.5 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allItems.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-brand-800 bg-brand-800 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-brand-300"
                    }`}
                  >
                    {t(`items.${item.key}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
