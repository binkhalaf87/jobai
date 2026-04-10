type PublicConfig = {
  apiUrl: string;
};

function getRequiredPublicEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing required frontend environment variable: ${name}. Add it to frontend/.env.local or your Vercel project settings.`
    );
  }

  return value;
}

function createPublicConfig(): PublicConfig {
  return {
    apiUrl: getRequiredPublicEnv("NEXT_PUBLIC_API_URL")
  };
}

// This helper centralizes access to public frontend environment variables.
export const publicConfig = createPublicConfig();

