import { AuthForm } from "@/components/auth-form";
import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";

// This route provides account creation using the backend register endpoint.
export default function RegisterPage() {
  return (
    <PageContainer className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <Panel className="w-full max-w-md p-8">
        <AuthForm mode="register" />
      </Panel>
    </PageContainer>
  );
}
