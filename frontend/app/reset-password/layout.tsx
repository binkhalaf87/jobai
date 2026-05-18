import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
