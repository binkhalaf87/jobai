import { AuthForm } from "@/components/auth-form";
import { PageContainer } from "@/components/page-container";
import { Panel } from "@/components/panel";

// This route provides the connected login flow for the frontend application.
export default function LoginPage() {
  return (
    <PageContainer className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <Panel className="w-full max-w-md p-8">
        <AuthForm mode="login" />
      </Panel>
    </PageContainer>
  );
}
