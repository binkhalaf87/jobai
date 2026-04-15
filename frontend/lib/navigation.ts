import type { NavItem } from "@/types";

export type DashboardNavGroup = {
  label: string;
  key: string;
  items: NavItem[];
};

// Site header navigation for public-facing routes.
export const NAV_LINKS: NavItem[] = [
  { label: "Overview", key: "overview", href: "/" },
  { label: "Login", key: "login", href: "/login" },
  { label: "Get Started", key: "getStarted", href: "/register" },
];

// Dashboard sidebar navigation grouped by functional area.
export const DASHBOARD_NAV_GROUPS: DashboardNavGroup[] = [
  {
    label: "Workspace",
    key: "workspace",
    items: [
      { label: "Dashboard", key: "dashboard", href: "/dashboard", icon: "home" },
      { label: "CVs", key: "cvs", href: "/dashboard/resumes", icon: "file-text" },
    ],
  },
  {
    label: "Actions",
    key: "actions",
    items: [
      { label: "Analyze", key: "analyze", href: "/dashboard/analysis", icon: "bar-chart" },
      { label: "Improve", key: "improve", href: "/dashboard/enhancement", icon: "sparkles" },
      { label: "AI Interview", key: "aiInterview", href: "/dashboard/ai-interview", icon: "mic" },
      { label: "Jobs", key: "jobs", href: "/dashboard/job-search", icon: "search" },
      { label: "Send", key: "send", href: "/dashboard/smart-send", icon: "send" },
    ],
  },
  {
    label: "Account",
    key: "account",
    items: [
      { label: "Billing", key: "billing", href: "/dashboard/billing", icon: "credit-card" },
      { label: "Points", key: "points", href: "/dashboard/points", icon: "star" },
      { label: "Profile", key: "profile", href: "/dashboard/profile", icon: "user" },
    ],
  },
];

// Flat list for components that need all dashboard links without grouping.
export const DASHBOARD_LINKS: NavItem[] = DASHBOARD_NAV_GROUPS.flatMap((g) => g.items);
