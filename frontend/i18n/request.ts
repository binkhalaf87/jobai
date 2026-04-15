import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async () => {
  // Read locale from cookie; fall back to default
  const cookieStore = cookies();
  const raw = cookieStore.get("locale")?.value ?? defaultLocale;
  const locale = (locales as readonly string[]).includes(raw) ? (raw as Locale) : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
