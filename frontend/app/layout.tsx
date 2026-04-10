import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PageContainer } from "@/components/page-container";
import { SiteHeader } from "@/components/site-header";
import { publicConfig } from "@/lib/config";

// This root layout defines shared metadata and wraps every route in the application.
export const metadata: Metadata = {
  title: "JobAI",
  description: "Resume analysis platform starter frontend"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  // Accessing the shared config here makes missing public env values fail early and clearly.
  void publicConfig.apiUrl;

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <div className="relative min-h-screen overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-b from-slate-200/70 via-slate-50 to-transparent" />
          <SiteHeader />
          <main className="py-10">{children}</main>
          <footer className="border-t border-slate-200/80 py-6">
            <PageContainer>
              <p className="text-sm text-slate-500">
                Starter UI for a resume analysis platform. Product workflows can be added here later.
              </p>
            </PageContainer>
          </footer>
        </div>
      </body>
    </html>
  );
}
