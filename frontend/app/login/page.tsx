import { AuthForm } from "@/components/auth-form";
import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <PageContainer className="flex min-h-screen items-center justify-center">
      <Panel className="w-full max-w-md p-8">
        <AuthForm mode="login" googleError={params.error === "google_auth_failed"} />
      </Panel>
    </PageContainer>
  );
}
