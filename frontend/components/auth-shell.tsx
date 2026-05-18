"use client";

import type { ReactNode } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-50">
      <div className="absolute end-4 top-4 z-10">
        <LocaleSwitcher />
      </div>
      {children}
    </div>
  );
}
