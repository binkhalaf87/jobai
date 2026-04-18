"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard, Users, Briefcase, SlidersHorizontal, Mic,
  CreditCard, UserCircle, Star, ChevronDown, LogOut,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { LocaleSwitcher } from "@/components/locale-switcher";

/* ── nav items ── */
const NAV_ITEMS = [
  { label: "Dashboard",    href: "/recruiter",              icon: "home" },
  { label: "Candidates",   href: "/recruiter/candidates",   icon: "users" },
  { label: "Jobs",         href: "/recruiter/jobs",         icon: "briefcase" },
  { label: "AI Screening", href: "/recruiter/ai-screening", icon: "filter" },
  { label: "AI Interview", href: "/recruiter/ai-interview", icon: "mic" },
  { label: "Billing",      href: "/recruiter/billing",      icon: "credit-card" },
] as const;

const ACCOUNT_ITEMS = [
  { label: "Subscription", href: "/recruiter/billing", icon: "credit-card" },
  { label: "Points",       href: "/recruiter/billing", icon: "star" },
  { label: "Profile",      href: "/recruiter/profile", icon: "user" },
];

/* ── icon + color config ── */
type IconCfg = {
  icon: ReactNode;
  iconBg: string; iconText: string;
  activeIconBg: string; activeBg: string; activeText: string;
};

const NAV_ICON_CFG: Record<string, IconCfg> = {
  home: {
    icon: <LayoutDashboard size={13} />,
    iconBg: "bg-brand-100", iconText: "text-brand-600",
    activeIconBg: "bg-brand-600", activeBg: "bg-brand-50", activeText: "text-brand-700",
  },
  users: {
    icon: <Users size={13} />,
    iconBg: "bg-violet-100", iconText: "text-violet-600",
    activeIconBg: "bg-violet-600", activeBg: "bg-violet-50", activeText: "text-violet-700",
  },
  briefcase: {
    icon: <Briefcase size={13} />,
    iconBg: "bg-sky-100", iconText: "text-sky-600",
    activeIconBg: "bg-sky-600", activeBg: "bg-sky-50", activeText: "text-sky-700",
  },
  filter: {
    icon: <SlidersHorizontal size={13} />,
    iconBg: "bg-orange-100", iconText: "text-orange-600",
    activeIconBg: "bg-orange-500", activeBg: "bg-orange-50", activeText: "text-orange-700",
  },
  mic: {
    icon: <Mic size={13} />,
    iconBg: "bg-rose-100", iconText: "text-rose-600",
    activeIconBg: "bg-rose-600", activeBg: "bg-rose-50", activeText: "text-rose-700",
  },
  "credit-card": {
    icon: <CreditCard size={13} />,
    iconBg: "bg-green-100", iconText: "text-green-600",
    activeIconBg: "bg-green-600", activeBg: "bg-green-50", activeText: "text-green-700",
  },
  star: {
    icon: <Star size={13} />,
    iconBg: "bg-yellow-100", iconText: "text-yellow-600",
    activeIconBg: "bg-yellow-500", activeBg: "bg-yellow-50", activeText: "text-yellow-700",
  },
  user: {
    icon: <UserCircle size={13} />,
    iconBg: "bg-slate-100", iconText: "text-slate-500",
    activeIconBg: "bg-slate-600", activeBg: "bg-slate-100", activeText: "text-slate-700",
  },
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/recruiter") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasSession, signOut } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasSession) router.replace("/login");
  }, [hasSession, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          <p className="text-[11px] font-semibold tracking-widest text-slate-400">JOBAI</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "recruiter") return null;

  const currentPage = [...NAV_ITEMS].reverse().find((item) => isActive(pathname, item.href));
  const initials = (user.full_name ?? user.email)
    .split(" ").slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* ══ Sidebar ══ */}
      <aside className="sticky top-0 hidden h-screen w-56 flex-shrink-0 border-r border-slate-200/70 bg-white shadow-sm md:flex md:flex-col">

        {/* Logo */}
        <div className="px-4 py-4">
          <Link href="/recruiter" className="inline-flex items-center gap-2">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-[9px] font-bold text-white shadow shadow-brand-800/25">
              JR
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-white bg-teal" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900 leading-none">JobAI</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-none mt-0.5">Recruiter</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Navigation</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const cfg = NAV_ICON_CFG[item.icon] ?? NAV_ICON_CFG.home;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-all",
                      active
                        ? `${cfg.activeBg} ${cfg.activeText} font-semibold`
                        : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                  >
                    <span className={[
                      "flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-md transition-all",
                      active ? `${cfg.activeIconBg} text-white` : `${cfg.iconBg} ${cfg.iconText}`,
                    ].join(" ")}>
                      {cfg.icon}
                    </span>
                    <span className="flex-1 leading-none">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Account footer */}
        <div className="border-t border-slate-100 p-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAccountMenu((c) => !c)}
              className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition hover:bg-slate-50"
              aria-expanded={showAccountMenu}
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-700 to-brand-900 text-[10px] font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11.5px] font-semibold text-slate-900">{user.full_name ?? "Recruiter"}</p>
                <p className="truncate text-[10px] text-slate-400">{user.email}</p>
              </div>
              <ChevronDown size={12} className="flex-shrink-0 text-slate-400" />
            </button>

            {showAccountMenu && (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="p-1.5">
                  {ACCOUNT_ITEMS.map((item) => {
                    const cfg = NAV_ICON_CFG[item.icon] ?? NAV_ICON_CFG.user;
                    return (
                      <Link
                        key={item.href + item.label}
                        href={item.href}
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md ${cfg.iconBg} ${cfg.iconText}`}>
                          {cfg.icon}
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                  <div className="my-1.5 border-t border-slate-100" />
                  <button
                    type="button"
                    onClick={() => { signOut(); router.replace("/login"); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-red-500 transition hover:bg-red-50"
                  >
                    <LogOut size={13} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ══ Main content ══ */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-5 py-3 md:px-6">
            <div className="flex items-center gap-2.5">
              {currentPage && (
                <span className={[
                  "flex h-6 w-6 items-center justify-center rounded-lg",
                  (NAV_ICON_CFG[currentPage.icon] ?? NAV_ICON_CFG.home).activeIconBg,
                  "text-white",
                ].join(" ")}>
                  {(NAV_ICON_CFG[currentPage.icon] ?? NAV_ICON_CFG.home).icon}
                </span>
              )}
              <h1 className="text-[15px] font-bold tracking-tight text-slate-900">
                {currentPage?.label ?? "Dashboard"}
              </h1>
            </div>
            <LocaleSwitcher />
          </div>

          {/* Mobile nav */}
          <div className="border-t border-slate-100 px-4 py-2 md:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                const cfg = NAV_ICON_CFG[item.icon] ?? NAV_ICON_CFG.home;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                      active ? `${cfg.activeBg} ${cfg.activeText}` : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-7">{children}</main>
      </div>
    </div>
  );
}
