"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";

export function usePageTracking(): void {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    const token =
      typeof window !== "undefined"
        ? (window.localStorage.getItem("jobai_access_token") ?? "")
        : "";
    if (!token) return;

    void fetch(`${getApiBaseUrl()}/tracking/page-view`, {
      method: "POST",
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }, [pathname]);
}
