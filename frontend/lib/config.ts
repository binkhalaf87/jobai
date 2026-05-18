type PublicConfig = {
  apiUrl: string;
};

const LOCAL_DEV_API_URL = "http://localhost:8000/api/v1";

function getBundledPublicApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
}

function shouldUseExternalProductionApiUrl(): boolean {
  return process.env.NEXT_PUBLIC_USE_EXTERNAL_API_URL === "true";
}

function getLocalDevelopmentApiUrl(): string {
  return LOCAL_DEV_API_URL;
}

export function getRequiredPublicApiUrl(): string {
  const value = getBundledPublicApiUrl();

  if (value && (process.env.NODE_ENV !== "production" || shouldUseExternalProductionApiUrl())) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    return getLocalDevelopmentApiUrl();
  }

  // In production with the Next.js proxy rewrite, requests go to /api/v1
  // on the same Vercel origin — no cross-origin cookie issues.
  return "/api/v1";
}

function createPublicConfig(): PublicConfig {
  return {
    apiUrl: getRequiredPublicApiUrl()
  };
}

// Lazy singleton — deferred until first actual API call so that importing
// this module during static generation / SSR does not throw when the env
// variable is absent (e.g. build-time rendering of non-API pages).
let _publicConfig: PublicConfig | null = null;

export function getPublicConfig(): PublicConfig {
  if (!_publicConfig) {
    _publicConfig = createPublicConfig();
  }
  return _publicConfig;
}

// Back-compat export kept for any call sites not yet migrated.
// @deprecated — import getPublicConfig() instead.
export const publicConfig = { get apiUrl() { return getPublicConfig().apiUrl; } };
