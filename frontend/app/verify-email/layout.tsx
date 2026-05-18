import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
