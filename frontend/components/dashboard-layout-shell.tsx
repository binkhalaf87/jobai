"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";
import { useAuth } from "@/hooks/use-auth";
import { DASHBOARD_LINKS } from "@/lib/navigation";

type DashboardLayoutShellProps = {
  children: ReactNode;
};

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

// This shared dashboard shell keeps auth, navigation, and workspace framing in one place.
export function DashboardLayoutShell({ children }: DashboardLayoutShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasSession, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !hasSession) {
      router.replace("/login");
    }
  }, [hasSession, isLoading, router]);

  if (isLoading) {
    return (
      <PageContainer className="flex min-h-[calc(100vh-14rem)] items-center justify-center">
        <Panel className="w-full max-w-xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Loading dashboard</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Preparing your workspace...</h1>
        </Panel>
      </PageContainer>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PageContainer className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <Panel className="overflow-hidden p-6">
          <div className="rounded-[2rem] bg-slate-950 p-5 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Workspace</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">JobAI Dashboard</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Manage resumes, run analyses, and keep the account setup tidy from one place.
            </p>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Signed in as</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{user.full_name || "Workspace Owner"}</p>
            <p className="mt-1 break-all text-sm text-slate-500">{user.email}</p>
          </div>

          <nav className="mt-5 space-y-2">
            {DASHBOARD_LINKS.map((link) => {
              const active = isLinkActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  <span>{link.label}</span>
                  {active ? <span className="text-xs uppercase tracking-[0.18em] text-slate-300">Open</span> : null}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
            className="mt-5 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          >
            Sign out
          </button>
        </Panel>
      </aside>

      <div className="min-w-0 space-y-6">{children}</div>
    </PageContainer>
  );
}
