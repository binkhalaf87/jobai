"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LayoutDashboard, Users, LogOut, Shield, ListChecks } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { label: "Overview",  href: "/admin",        icon: LayoutDashboard },
  { label: "Users",     href: "/admin/users",  icon: Users },
  { label: "Lists",     href: "/admin/lists",  icon: ListChecks },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasSession, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !hasSession) router.replace("/login");
  }, [hasSession, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  const initials = (user.full_name ?? user.email)
    .split(" ").slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">

      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-52 flex-shrink-0 border-r border-slate-200/70 bg-white shadow-sm md:flex md:flex-col">

        {/* Logo */}
        <div className="px-4 py-4">
          <Link href="/admin" className="inline-flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
              <Shield size={14} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900 leading-none">JobAI</p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 leading-none mt-0.5">Admin</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1">
          <p className="mb-1 px-2 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Navigation</p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={[
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[12.5px] transition-all",
                      active
                        ? "bg-slate-900 text-white font-semibold"
                        : "font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                  >
                    <Icon size={13} />
                    <span className="flex-1 leading-none">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-100 p-2">
          <div className="flex items-center gap-2 rounded-lg p-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900 text-[10px] font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-900">{user.full_name ?? "Admin"}</p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { signOut(); router.replace("/login"); }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={13} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur px-5 py-3 md:px-6">
          <p className="text-[15px] font-bold tracking-tight text-slate-900">
            {NAV_ITEMS.find((i) => isActive(pathname, i.href))?.label ?? "Admin"}
          </p>
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-7">{children}</main>
      </div>
    </div>
  );
}
