import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/page-container";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { NAV_LINKS } from "@/lib/navigation";

// This header defines the top-level navigation shared by every public route.
export async function SiteHeader() {
  const t = await getTranslations("nav.public");

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur">
      <PageContainer className="flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
          JobAI
        </Link>
        <nav className="flex items-center gap-2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900"
            >
              {link.key ? t(link.key as Parameters<typeof t>[0]) : link.label}
            </Link>
          ))}
          <LocaleSwitcher />
        </nav>
      </PageContainer>
    </header>
  );
}
