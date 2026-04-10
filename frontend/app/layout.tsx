import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

// This root layout is intentionally minimal so each route group can define its own chrome.
export const metadata: Metadata = {
  title: "JobAI",
  description: "AI-powered resume analysis and career tools"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
