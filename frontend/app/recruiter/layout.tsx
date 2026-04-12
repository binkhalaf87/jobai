"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { clearApiToken } from "@/lib/api";

// ─── Constants ───────────────────────────────────────────────────────────────

const TOKEN_KEY = "jobai_access_token";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/recruiter", icon: "home" },
  { label: "Candidates", href: "/recruiter/candidates", icon: "users" },
  { label: "Jobs", href: "/recruiter/jobs", icon: "briefcase" },
] as const;

// ─── JWT decode (no external dependency) ─────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split(".")[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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

// ─── Active link detection ────────────────────────────────────────────────────

function isActive(pathname: string, href: string): boolean {
  if (href === "/recruiter") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RecruiterLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? window.localStorage.getItem(TOKEN_KEY)
        : null;

    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeJwtPayload(token);

    if (!payload || payload.role !== "recruiter") {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Loading
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
            Preparing recruiter workspace…
          </h1>
        </div>
      </div>
    );
  }

  const currentLabel =
    [...NAV_ITEMS].reverse().find((item) => isActive(pathname, item.href))
      ?.label ?? "Dashboard";

  function handleSignOut() {
    clearApiToken();
    router.replace("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-slate-100 px-6">
          <Link
            href="/recruiter"
            className="text-lg font-bold tracking-tight text-slate-900"
          >
            JobAI Recruiter
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Navigation
          </p>
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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

        {/* Footer */}
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main area ───────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top header */}
        <header className="flex h-16 flex-shrink-0 items-center border-b border-slate-200 bg-white px-6 md:px-8">
          <h1 className="text-base font-semibold text-slate-900">
            {currentLabel}
          </h1>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
