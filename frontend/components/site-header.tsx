import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/page-container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NAV_LINKS } from "@/lib/navigation";

// This header defines the top-level navigation shared by every public route.
export async function SiteHeader() {
  const publicT = await getTranslations("nav.public");

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <PageContainer className="flex h-20 items-center justify-between gap-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-950">
          JobAI
        </Link>
        <div className="flex flex-1 items-center justify-end gap-3">
          <nav className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {link.key ? publicT(link.key as Parameters<typeof publicT>[0]) : link.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/register"
            className="hidden rounded-full bg-brand-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 md:inline-flex"
          >
            {publicT("cta")}
          </Link>
          <LocaleSwitcher />
        </div>
      </PageContainer>
    </header>
  );
}
