import "./globals.css";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { CapacitorInit } from "@/components/capacitor-init";

export const metadata: Metadata = {
  title: "JobAI24",
  description: "AI-powered resume analysis and career tools",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Analytics />
          <CapacitorInit />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
