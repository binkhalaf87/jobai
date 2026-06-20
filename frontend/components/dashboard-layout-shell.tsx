"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, FileText, BarChart3, Sparkles, Mic,
  Search, Send, Star, CreditCard, UserCircle, ChevronDown, LogOut, HeadphonesIcon,
} from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { useBalance, type FeatureCredits } from "@/hooks/use-balance";
import { usePageTracking } from "@/hooks/usePageTracking";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { DASHBOARD_NAV_GROUPS } from "@/lib/navigation";
import { resendVerification } from "@/lib/auth";
import { getUnreadCount } from "@/lib/support";

/* ── icon + color config per nav item ── */
type IconCfg = {
  icon: ReactNode;
  iconBg: string;
  iconText: string;
  activeIconBg: string;
  activeBg: string;
  activeText: string;
};

const NAV_ICON_CFG: Record<string, IconCfg> = {
  home: {
    icon: <LayoutDashboard size={13} />,
    iconBg: "bg-brand-100", iconText: "text-brand-600",
    activeIconBg: "bg-brand-600", activeBg: "bg-brand-50", activeText: "text-brand-700",
  },
  "file-text": {
    icon: <FileText size={13} />,
    iconBg: "bg-violet-100", iconText: "text-violet-600",
    activeIconBg: "bg-violet-600", activeBg: "bg-violet-50", activeText: "text-violet-700",
  },
  "bar-chart": {
    icon: <BarChart3 size={13} />,
    iconBg: "bg-amber-100", iconText: "text-amber-600",
    activeIconBg: "bg-amber-500", activeBg: "bg-amber-50", activeText: "text-amber-700",
  },
  sparkles: {
    icon: <Sparkles size={13} />,
    iconBg: "bg-emerald-100", iconText: "text-emerald-600",
    activeIconBg: "bg-emerald-600", activeBg: "bg-emerald-50", activeText: "text-emerald-700",
  },
  mic: {
    icon: <Mic size={13} />,
    iconBg: "bg-rose-100", iconText: "text-rose-600",
    activeIconBg: "bg-rose-600", activeBg: "bg-rose-50", activeText: "text-rose-700",
  },
  search: {
    icon: <Search size={13} />,
    iconBg: "bg-cyan-100", iconText: "text-cyan-600",
    activeIconBg: "bg-cyan-600", activeBg: "bg-cyan-50", activeText: "text-cyan-700",
  },
  send: {
    icon: <Send size={13} />,
    iconBg: "bg-indigo-100", iconText: "text-indigo-600",
    activeIconBg: "bg-indigo-600", activeBg: "bg-indigo-50", activeText: "text-indigo-700",
  },
  star: {
    icon: <Star size={13} />,
    iconBg: "bg-yellow-100", iconText: "text-yellow-600",
    activeIconBg: "bg-yellow-500", activeBg: "bg-yellow-50", activeText: "text-yellow-700",
  },
  "credit-card": {
    icon: <CreditCard size={13} />,
    iconBg: "bg-green-100", iconText: "text-green-600",
    activeIconBg: "bg-green-600", activeBg: "bg-green-50", activeText: "text-green-700",
  },
  user: {
    icon: <UserCircle size={13} />,
    iconBg: "bg-slate-100", iconText: "text-slate-500",
    activeIconBg: "bg-slate-600", activeBg: "bg-slate-100", activeText: "text-slate-700",
  },
  support: {
    icon: <HeadphonesIcon size={13} />,
    iconBg: "bg-teal-100", iconText: "text-teal-600",
    activeIconBg: "bg-teal-600", activeBg: "bg-teal-50", activeText: "text-teal-700",
  },
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function EmailVerificationBanner({ email }: { email: string }) {
  const t = useTranslations("nav.emailVerificationBanner");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    setState("sending");
    try {
      await resendVerification(email);
      setState("sent");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-5 py-2.5 md:px-7">
      <p className="text-xs font-medium text-amber-800">
        {state === "sent" ? t("sent") : state === "error" ? t("error") : t("message")}
      </p>
      {state === "idle" || state === "error" ? (
        <button
          type="button"
          onClick={handleResend}
          className="shrink-0 rounded-full border border-amber-400 bg-white px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
        >
          {t("resend")}
        </button>
      ) : state === "sending" ? (
        <span className="shrink-0 text-xs text-amber-600">{t("resending")}</span>
      ) : null}
    </div>
  );
}

type DashboardLayoutShellProps = { children: ReactNode };

export function DashboardLayoutShell({ children }: DashboardLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasSession, signOut } = useAuth();
  const { credits, isLoading: creditsLoading } = useBalance();
  const t = useTranslations("nav");

  usePageTracking();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [supportUnread, setSupportUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function fetchUnread() {
      try {
        const { count } = await getUnreadCount();
        if (!cancelled) setSupportUnread(count);
      } catch { /* ignore */ }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  const allItems = DASHBOARD_NAV_GROUPS.flatMap((g) => g.items);
  const mobileNavItems = DASHBOARD_NAV_GROUPS.filter((g) => g.key !== "account").flatMap((g) => g.items);
  const currentItem = allItems.find((item) => isActive(pathname, item.href));
  const currentLabel = currentItem ? t(`items.${currentItem.key}`) : t("items.dashboard");

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

  if (!user) return null;

  const accountItems = DASHBOARD_NAV_GROUPS.find((g) => g.key === "account")?.items ?? [];
  const initials = (user.full_name ?? user.email)
    .split(" ").slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* ══ Sidebar ══ */}
      <aside className="sticky top-0 hidden h-screen w-56 flex-shrink-0 border-r border-slate-200/70 bg-white shadow-sm md:flex md:flex-col">

        {/* Logo */}
        <div className="px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-[9px] font-black text-white shadow shadow-brand-800/25 tracking-tighter">
              J24
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-white bg-teal" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900">
              JobAI<span className="text-brand-600">24</span>
            </span>
          </Link>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {DASHBOARD_NAV_GROUPS.filter((g) => g.key !== "account").map((group, gi) => (
            <div key={group.key} className={gi > 0 ? "mt-2 border-t border-slate-100 pt-2" : ""}>
              <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {t(`groups.${group.key}`)}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const cfg = NAV_ICON_CFG[item.icon ?? "home"] ?? NAV_ICON_CFG.home;
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
                          "flex h-5.5 w-5.5 h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-md transition-all",
                          active
                            ? `${cfg.activeIconBg} text-white`
                            : `${cfg.iconBg} ${cfg.iconText}`,
                        ].join(" ")}>
                          {cfg.icon}
                        </span>
                        <span className="flex-1 leading-none">{t(`items.${item.key}`)}</span>
                        {item.key === "support" && supportUnread > 0 && (
                          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[9px] font-bold text-white">
                            {supportUnread > 9 ? "9+" : supportUnread}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Credits widget */}
        <div className="mx-2 mb-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
              {t("balanceWidget.title")}
            </p>
            <Link
              href="/dashboard/billing"
              className="text-[10px] font-semibold text-brand-700 hover:underline"
            >
              {t("balanceWidget.topUp")} →
            </Link>
          </div>
          {creditsLoading ? (
            <div className="space-y-1.5">
              {[1,2,3,4].map((i) => <div key={i} className="h-3.5 w-full animate-pulse rounded bg-brand-200" />)}
            </div>
          ) : (
            <ul className="space-y-1">
              {([
                ["resume_analysis",    t("balanceWidget.analysis"),    null],
                ["resume_improvement", t("balanceWidget.improvement"), null],
                ["mock_interview",     t("balanceWidget.interview"),   null],
                ["smart_send_contacts",t("balanceWidget.contacts"),    t("balanceWidget.contactsUnit")],
              ] as [keyof FeatureCredits, string, string | null][]).map(([key, label, unit]) => {
                const qty = credits?.[key] ?? 0;
                return (
                  <li key={key} className="flex items-center justify-between gap-1">
                    <span className="text-[10.5px] text-brand-700 leading-tight truncate">{label}</span>
                    <span className={`flex-shrink-0 text-[10.5px] font-bold leading-tight ${qty > 0 ? "text-brand-900" : "text-brand-300"}`}>
                      {qty}{unit ? ` ${unit}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

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
                <p className="truncate text-[11.5px] font-semibold text-slate-900">{user.full_name ?? user.email}</p>
                <p className="truncate text-[10px] text-slate-400">{user.email}</p>
              </div>
              <ChevronDown size={12} className="flex-shrink-0 text-slate-400" />
            </button>

            {showAccountMenu && (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="p-1.5">
                  {accountItems.map((item) => {
                    const cfg = NAV_ICON_CFG[item.icon ?? "user"] ?? NAV_ICON_CFG.user;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowAccountMenu(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md ${cfg.iconBg} ${cfg.iconText}`}>
                          {cfg.icon}
                        </span>
                        {t(`items.${item.key}`)}
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
                    {t("user.signOut")}
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
            <h1 className="text-[15px] font-bold tracking-tight text-slate-900">{currentLabel}</h1>
            <LocaleSwitcher />
          </div>

          {/* Mobile nav pills */}
          <div className="border-t border-slate-100 px-4 py-2 md:hidden">
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {mobileNavItems.map((item) => {
                const active = isActive(pathname, item.href);
                const cfg = NAV_ICON_CFG[item.icon ?? "home"] ?? NAV_ICON_CFG.home;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex flex-shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                      active ? `${cfg.activeBg} ${cfg.activeText}` : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    <span className={`flex h-3.5 w-3.5 items-center justify-center rounded ${active ? cfg.activeIconBg + " text-white" : cfg.iconBg + " " + cfg.iconText}`}>
                      {cfg.icon}
                    </span>
                    {t(`items.${item.key}`)}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        {user && !user.is_email_verified && <EmailVerificationBanner email={user.email} />}
        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-7">{children}</main>
      </div>
    </div>
  );
}
