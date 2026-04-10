type PublicConfig = {
  apiUrl: string;
};

function getOptionalPublicEnv(name: string): string {
  const value = process.env[name];
  return value?.trim() ?? "";
}

export function getRequiredPublicApiUrl(): string {
  const value = getOptionalPublicEnv("NEXT_PUBLIC_API_URL");

  if (!value) {
    throw new Error(
      "Missing required frontend environment variable: NEXT_PUBLIC_API_URL. Add it to frontend/.env.local or your Vercel project settings."
    );
  }

  return value;
}

function createPublicConfig(): PublicConfig {
  return {
    apiUrl: getOptionalPublicEnv("NEXT_PUBLIC_API_URL")
  };
}

// This helper centralizes access to public frontend environment variables.
// The app shell can render even if the API URL is missing, while API calls still fail with a clear message.
export const publicConfig = createPublicConfig();
