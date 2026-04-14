"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/recruiter", icon: "home" },
  { label: "Candidates", href: "/recruiter/candidates", icon: "users" },
  { label: "Jobs", href: "/recruiter/jobs", icon: "briefcase" },
  { label: "Billing", href: "/recruiter/billing", icon: "credit-card" },
] as const;

const PAGE_DESCRIPTIONS: Record<string, string> = {
  Dashboard: "See pipeline health, top-ranked candidates, and the next hiring actions that need attention.",
  Candidates: "Review parsed candidate profiles, run AI analysis in bulk, and move people through the pipeline quickly.",
  Jobs: "Create the roles that power matching, candidate ranking, and interview planning.",
  Billing: "Manage recruiter subscriptions and launch Paymob checkout without leaving the workspace.",
};

function NavIcon({ id }: { id: string }) {
  const icons: Record<string, ReactNode> = {
    home: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    briefcase: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
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
  if (href === "/recruiter") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasSession, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !hasSession) router.replace("/login");
  }, [hasSession, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ffffff,_#eff6ff_55%,_#f8fafc)]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Loading</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Preparing recruiter workspace...</h1>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "recruiter") return null;

  const currentPage = [...NAV_ITEMS].reverse().find((item) => isActive(pathname, item.href));
  const initials = (user.full_name ?? user.email)
    .split(" ")
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_right,_#ffffff,_#f8fafc_50%,_#ecfeff_100%)] text-slate-900">
      <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200/80 bg-white/85 backdrop-blur md:flex md:flex-col">
        <div className="border-b border-slate-100 px-6 py-6">
          <Link href="/recruiter" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              JR
            </span>
            JobAI Recruiter
          </Link>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Hiring Workspace</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Operate sourcing, ranking, and decisions in one flow</p>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              Upload candidates, compare them to live roles, and keep the whole pipeline moving from one place.
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Navigation</p>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                  >
                    <NavIcon id={item.icon} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.full_name ?? "Recruiter"}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            className="mt-3 w-full rounded-2xl px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
          <div className="px-5 py-5 md:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Recruiter ATS</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                  {currentPage?.label ?? "Dashboard"}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {PAGE_DESCRIPTIONS[currentPage?.label ?? "Dashboard"] ?? PAGE_DESCRIPTIONS.Dashboard}
                </p>
              </div>
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-500 md:block">
                <p className="font-semibold text-slate-700">Role</p>
                <p>Recruiter</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
