"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
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

const PAGE_DESCRIPTIONS: Record<string, string> = {
  Dashboard: "Track your CV quality, matching momentum, outreach, and interview readiness from one place.",
  "My Resumes": "Keep one clear active resume, review parsing quality, and prepare the strongest version for analysis.",
  Analysis: "Turn your resume into a practical ATS report with clear strengths, weaknesses, and next actions.",
  Enhancement: "Rewrite and polish your CV with AI without leaving the product flow.",
  "AI Interview": "Practice with role-aware questions, score your answers, and improve before recruiter conversations.",
  "Job Search": "Find promising roles, understand why they match, and move them straight into action.",
  "Smart Send": "Build targeted outreach campaigns, send in batches, and track every delivery outcome.",
  Points: "Monitor plan usage and how much analysis capacity you still have available.",
  Profile: "Update account details that shape your workspace and saved activity.",
};

type DashboardLayoutShellProps = { children: ReactNode };

export function DashboardLayoutShell({ children }: DashboardLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasSession, signOut } = useAuth();

  const allItems = DASHBOARD_NAV_GROUPS.flatMap((group) => group.items);
  const currentPage = allItems.find((item) => isActive(pathname, item.href));

  useEffect(() => {
    if (!isLoading && !hasSession) router.replace("/login");
  }, [hasSession, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_55%,_#f8fafc)]">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Loading</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Preparing your career workspace...</h1>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.full_name ?? user.email)
    .split(" ")
    .slice(0, 2)
    .map((segment: string) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div className="flex min-h-screen bg-[radial-gradient(circle_at_top_left,_#ffffff,_#f8fafc_45%,_#eef2ff_100%)] text-slate-900">
      <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200/80 bg-white/85 backdrop-blur md:flex md:flex-col">
        <div className="border-b border-slate-100 px-6 py-6">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-950">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
              J
            </span>
            JobAI
          </Link>
          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Job Seeker Flow</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">From CV quality to application momentum</p>
            <p className="mt-2 text-xs leading-6 text-slate-600">
              Upload, analyze, improve, match, send, and practice in one guided workspace.
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
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
                        {item.icon && <NavIcon id={item.icon} />}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.full_name ?? "Job seeker"}</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Career Workspace</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
                  {currentPage?.label ?? "Dashboard"}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {PAGE_DESCRIPTIONS[currentPage?.label ?? "Dashboard"] ?? PAGE_DESCRIPTIONS.Dashboard}
                </p>
              </div>
              <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs text-slate-500 md:block">
                <p className="font-semibold text-slate-700">Role</p>
                <p>Job seeker</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-5 py-3 md:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allItems.map((item) => {
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
