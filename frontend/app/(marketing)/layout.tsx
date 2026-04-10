import type { ReactNode } from "react";

import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";

// Marketing layout: wraps public-facing pages with the site header and footer.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-slate-200/70 via-slate-50 to-transparent" />
      <SiteHeader />
      <main className="py-10">{children}</main>
      <footer className="border-t border-slate-200/80 py-6">
        <PageContainer>
          <p className="text-sm text-slate-500">
            AI-powered resume analysis and career tools.
          </p>
        </PageContainer>
      </footer>
    </div>
  );
}
