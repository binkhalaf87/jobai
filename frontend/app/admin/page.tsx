"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, UserCheck, Briefcase, FileText, Send, Shield,
  Activity, LogIn, UserPlus, Settings,
  DollarSign, TrendingUp, Eye,
} from "lucide-react";

import {
  getAdminStats, getAdminActivity, getAdminAnalytics,
  type AdminStatsResponse, type AdminActivityResponse,
  type AdminActivityItem, type AdminAnalyticsResponse, type AdminVisitorPoint,
} from "@/lib/admin";

// ─── Payment KPI Card (prominent) ─────────────────────────────────────────────

function PaymentKpiCard({ label, value, icon: Icon, subLabel }: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  subLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 ring-1 ring-emerald-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-emerald-700">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
          <Icon size={16} className="text-white" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-extrabold tabular-nums text-emerald-900">
        {value === null ? "—" : value.toLocaleString()}
      </p>
      {subLabel && <p className="mt-1 text-xs text-emerald-600">{subLabel}</p>}
    </div>
  );
}

// ─── Regular Stat Card ────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string;
  value: number | null;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 transition-shadow ${href ? "cursor-pointer hover:shadow-md hover:border-slate-300" : ""}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
          <Icon size={14} className="text-white" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">
        {value === null ? "—" : value.toLocaleString()}
      </p>
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ─── Visitor KPI Card ─────────────────────────────────────────────────────────

function VisitorKpiCard({ label, value, sub }: { label: string; value: number | null; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-sky-100 p-5 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums text-sky-900">
        {value === null ? "—" : value.toLocaleString()}
      </p>
      <p className="mt-1 text-[11px] text-sky-500">{sub}</p>
    </div>
  );
}

// ─── Activity event config ────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  auth_login: "Logged in",
  auth_register: "Signed up",
  admin_user_updated: "User updated",
  admin_wallet_adjusted: "Wallet adjusted",
};

const EVENT_ICONS: Record<string, React.ElementType> = {
  auth_login: LogIn,
  auth_register: UserPlus,
  admin_user_updated: Settings,
  admin_wallet_adjusted: Settings,
};

const EVENT_COLORS: Record<string, string> = {
  auth_login: "bg-emerald-100 text-emerald-700",
  auth_register: "bg-brand-100 text-brand-700",
  admin_user_updated: "bg-violet-100 text-violet-700",
  admin_wallet_adjusted: "bg-amber-100 text-amber-700",
};

// ─── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart({ data }: { data: AdminAnalyticsResponse["monthly_revenue"] }) {
  if (!data.length) return (
    <p className="py-6 text-center text-sm text-slate-400">No revenue data yet</p>
  );

  const max = Math.max(...data.map((d) => d.revenue_sar), 1);
  const total = data.reduce((s, d) => s + d.revenue_sar, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Monthly Revenue</p>
          <p className="mt-0.5 text-xs text-slate-500">Successful payments — last 12 months</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">{total.toLocaleString()} SAR</p>
          <p className="text-xs text-slate-400">total</p>
        </div>
      </div>
      <div className="flex h-32 items-end gap-1">
        {data.map((d) => {
          const heightPct = Math.round((d.revenue_sar / max) * 100);
          return (
            <div key={d.month} className="group relative flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full cursor-default rounded-t bg-emerald-500 transition-colors hover:bg-emerald-400"
                style={{ height: `${Math.max(heightPct, 2)}%` }}
              />
              <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-10">
                {d.revenue_sar.toLocaleString()} SAR · {d.transactions} orders
              </div>
              <p className="text-[9px] text-slate-400">{d.month.slice(5)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Visitor Trend Chart ──────────────────────────────────────────────────────

type VisitorPeriod = "7d" | "30d" | "12mo";

function VisitorChart({ trends }: { trends: Record<string, AdminVisitorPoint[]> }) {
  const [period, setPeriod] = useState<VisitorPeriod>("30d");
  const data = trends[period] ?? [];
  const maxLogins = Math.max(...data.map((d) => d.logins), 1);

  const periodLabels: Record<VisitorPeriod, string> = { "7d": "7 Days", "30d": "30 Days", "12mo": "12 Months" };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-900">Visitor Trends</p>
          <p className="mt-0.5 text-xs text-slate-500">Logins &amp; new signups by period</p>
        </div>
        <div className="flex gap-1">
          {(["7d", "30d", "12mo"] as VisitorPeriod[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                period === p ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No data for this period</p>
      ) : (
        <>
          <div className="mb-3 flex gap-4">
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-brand-600" /> Logins
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-violet-400" /> Signups
            </span>
          </div>
          <div className="flex h-28 items-end gap-0.5">
            {data.map((d) => {
              const loginH = Math.round((d.logins / maxLogins) * 100);
              const signupH = Math.round((d.signups / maxLogins) * 100);
              const shortLabel = period === "12mo" ? d.label.slice(5) : d.label.slice(8);
              return (
                <div key={d.label} className="group relative flex flex-1 flex-col items-center gap-0.5">
                  <div className="flex w-full items-end gap-px" style={{ height: "100%" }}>
                    <div className="flex-1 cursor-default rounded-t bg-brand-600 transition-colors hover:bg-brand-500" style={{ height: `${Math.max(loginH, 2)}%` }} />
                    <div className="flex-1 cursor-default rounded-t bg-violet-400 transition-colors hover:bg-violet-300" style={{ height: `${Math.max(signupH, 2)}%` }} />
                  </div>
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block z-10">
                    {d.label} · {d.logins} logins · {d.signups} signups
                  </div>
                  {data.length <= 14 && <p className="text-[8px] text-slate-400">{shortLabel}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Activity Row ─────────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: AdminActivityItem }) {
  const label = EVENT_LABELS[item.event_type] ?? item.event_type.replace(/_/g, " ");
  const Icon = EVENT_ICONS[item.event_type] ?? Activity;
  const colorClass = EVENT_COLORS[item.event_type] ?? "bg-slate-100 text-slate-600";
  const name = item.user_name || item.user_email;
  const time = new Date(item.created_at).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-2.5 last:border-0">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-800">{name}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="shrink-0 text-xs text-slate-400">{time}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOverviewPage() {
  const [stats, setStats]       = useState<AdminStatsResponse | null>(null);
  const [activity, setActivity] = useState<AdminActivityResponse | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAdminStats(), getAdminActivity(), getAdminAnalytics()])
      .then(([s, a, an]) => { setStats(s); setActivity(a); setAnalytics(an); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <p className="text-[15px] font-bold text-slate-900">Platform Overview</p>
        <p className="mt-0.5 text-xs text-slate-500">الإيرادات، المستخدمون، ونشاط المنصة في لمحة.</p>
      </div>

      {/* Row 1 — Payment KPIs + Primary Users */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <PaymentKpiCard
          label="Total Revenue"
          value={stats ? Math.round(stats.total_revenue_sar) : null}
          icon={DollarSign}
          subLabel="SAR · كل الوقت"
        />
        <PaymentKpiCard
          label="Paid Orders"
          value={stats?.total_paid_orders ?? null}
          icon={TrendingUp}
          subLabel="successful transactions"
        />
        <StatCard label="Total Users"  value={stats?.total_users ?? null}  icon={Users}     color="bg-slate-800"   href="/admin/users" />
        <StatCard label="Active Users" value={stats?.active_users ?? null} icon={UserCheck}  color="bg-emerald-600" href="/admin/users" />
      </div>

      {/* Row 2 — Platform entities */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Jobseekers"       value={stats?.jobseekers ?? null}    icon={FileText}  color="bg-brand-600"  href="/admin/users" />
        <StatCard label="Recruiters"       value={stats?.recruiters ?? null}    icon={Briefcase} color="bg-violet-600" href="/admin/users" />
        <StatCard label="Admins"           value={stats?.admins ?? null}        icon={Shield}    color="bg-slate-900"  href="/admin/users" />
        <StatCard label="Resumes Uploaded" value={stats?.total_resumes ?? null} icon={FileText}  color="bg-sky-600" />
        <StatCard label="Emails Sent"      value={stats?.total_sends ?? null}   icon={Send}      color="bg-teal-600" />
      </div>

      {/* Row 3 — Activity + Visitors 24h */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Recent Activity</p>
              <p className="mt-0.5 text-xs text-slate-500">Last 15 events across all users</p>
            </div>
            <Link href="/admin/activity" className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
              View all →
            </Link>
          </div>
          {activity?.recent_activity.length ? (
            <div>
              {activity.recent_activity.map((item, i) => (
                <ActivityRow key={i} item={item} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">No activity yet</p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600">
              <Eye size={15} className="text-white" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Visitors</p>
              <p className="text-xs text-slate-500">Unique logins</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">آخر 24 ساعة</p>
              <p className="text-lg font-extrabold tabular-nums text-slate-900">{activity?.visitors_last_24h ?? "—"}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-500">اليوم</p>
              <p className="text-lg font-extrabold tabular-nums text-slate-900">{activity?.visitors_today ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4 — Visitor stats: today / month / year */}
      <div className="grid grid-cols-3 gap-4">
        <VisitorKpiCard
          label="زوار اليوم"
          value={activity?.visitors_today ?? null}
          sub="unique logins today"
        />
        <VisitorKpiCard
          label="زوار الشهر"
          value={activity?.visitors_this_month ?? null}
          sub="unique logins this month"
        />
        <VisitorKpiCard
          label="زوار العام"
          value={activity?.visitors_this_year ?? null}
          sub="unique logins this year"
        />
      </div>

      {/* Row 5 — Charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {analytics ? (
            <RevenueChart data={analytics.monthly_revenue} />
          ) : (
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          )}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          {analytics ? (
            <VisitorChart trends={analytics.visitor_trends} />
          ) : (
            <div className="h-40 animate-pulse rounded-xl bg-slate-100" />
          )}
        </div>
      </div>
    </div>
  );
}
