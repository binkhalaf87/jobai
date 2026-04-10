import type { ReactNode } from "react";

import { DashboardLayoutShell } from "@/components/dashboard-layout-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

// This nested layout gives every dashboard route the same authenticated workspace chrome.
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <DashboardLayoutShell>{children}</DashboardLayoutShell>;
}
