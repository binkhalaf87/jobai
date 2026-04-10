import type { NavItem } from "@/types";

export type DashboardNavGroup = {
  label: string;
  items: NavItem[];
};

// Site header navigation for public-facing routes.
export const NAV_LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
];

// Dashboard sidebar navigation grouped by functional area.
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    label: "Core",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "home" },
      { label: "My Resumes", href: "/dashboard/resumes", icon: "file-text" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { label: "Analysis", href: "/dashboard/analysis", icon: "bar-chart" },
      { label: "Enhancement", href: "/dashboard/enhancement", icon: "sparkles" },
      { label: "AI Interview", href: "/dashboard/ai-interview", icon: "mic" },
      { label: "Job Matching", href: "/dashboard/job-matching", icon: "target" },
      { label: "Smart Send", href: "/dashboard/smart-send", icon: "send" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Points", href: "/dashboard/points", icon: "star" },
      { label: "Profile", href: "/dashboard/profile", icon: "user" },
    ],
  },
];

// Flat list for components that need all dashboard links without grouping.
export const DASHBOARD_LINKS: NavItem[] = DASHBOARD_NAV_GROUPS.flatMap((g) => g.items);
