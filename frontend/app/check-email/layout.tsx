import type { ReactNode } from "react";
import { AuthShell } from "@/components/auth-shell";

export default function CheckEmailLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
