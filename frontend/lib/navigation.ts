import type { NavItem } from "@/types";

// This file keeps lightweight route metadata in one place for shared layout components.
export const NAV_LINKS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Login", href: "/login" },
  { label: "Register", href: "/register" },
  { label: "Dashboard", href: "/dashboard" }
];

// These links define the left-side workspace navigation shared by all dashboard routes.
export const DASHBOARD_LINKS: NavItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "My Resumes", href: "/dashboard/resumes" },
  { label: "My Analyses", href: "/dashboard/analyses" },
  { label: "New Analysis", href: "/dashboard/new-analysis" },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Settings", href: "/dashboard/settings" }
];
