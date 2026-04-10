type PublicConfig = {
  apiUrl: string;
};

const LOCAL_DEV_API_URL = "http://localhost:8000/api/v1";

function getBundledPublicApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL?.trim() ?? "";
}

function getLocalDevelopmentApiUrl(): string {
  return LOCAL_DEV_API_URL;
}

export function getRequiredPublicApiUrl(): string {
  const value = getBundledPublicApiUrl();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV !== "production") {
    return getLocalDevelopmentApiUrl();
  }

  throw new Error(
    "Missing required frontend environment variable: NEXT_PUBLIC_API_URL. Add it to frontend/.env.local or your Vercel project settings."
  );
}

function createPublicConfig(): PublicConfig {
  return {
    apiUrl: getRequiredPublicApiUrl()
  };
}

// This helper centralizes access to public frontend environment variables.
// Local development falls back to the default backend URL, while production still requires explicit configuration.
export const publicConfig = createPublicConfig();
