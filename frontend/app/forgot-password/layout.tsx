import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";

export default function ForgotPasswordLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
