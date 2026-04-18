import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export default getRequestConfig(async ({ requestLocale }) => {
  // Read locale from cookie first, fall back to request locale and then default.
  const cookieStore = cookies();
  const raw = cookieStore.get("locale")?.value;
  const cookieLocale = (locales as readonly string[]).includes(raw ?? "") ? (raw as Locale) : undefined;
  const locale = cookieLocale ?? (await requestLocale()) ?? defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
