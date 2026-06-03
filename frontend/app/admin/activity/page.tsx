"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, X } from "lucide-react";

import {
  getAdminActivityFeed,
  type AdminActivityItem,
  type AdminActivityFeedResponse,
} from "@/lib/admin";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  auth_login:                    "Logged in",
  auth_register:                 "Signed up",
  auth_logout:                   "Logged out",
  auth_email_verified:           "Email verified",
  auth_password_reset_requested: "Password reset requested",
  auth_password_reset_completed: "Password reset",
  resume_uploaded:               "Resume uploaded",
  resume_deleted:                "Resume deleted",
  analysis_requested:            "Analysis requested",
  analysis_completed:            "Analysis completed",
  rewrite_generated:             "Rewrite generated",
  billing_checkout_initiated:    "Checkout initiated",
  billing_payment_confirmed:     "Payment confirmed",
  billing_promo_applied:         "Promo code applied",
  admin_user_updated:            "User updated",
  admin_wallet_adjusted:         "Wallet adjusted",
  admin_promo_created:           "Promo code created",
  admin_promo_deleted:           "Promo code deleted",
  smtp_connected:                "SMTP connected",
  smtp_deleted:                  "SMTP deleted",
};

const EVENT_COLORS: Record<string, string> = {
  auth_login:                    "bg-emerald-100 text-emerald-700",
  auth_register:                 "bg-brand-100 text-brand-700",
  auth_logout:                   "bg-slate-100 text-slate-500",
  auth_email_verified:           "bg-teal-100 text-teal-700",
  auth_password_reset_requested: "bg-amber-100 text-amber-700",
  auth_password_reset_completed: "bg-amber-100 text-amber-700",
  resume_uploaded:               "bg-sky-100 text-sky-700",
  resume_deleted:                "bg-rose-100 text-rose-600",
  analysis_requested:            "bg-violet-100 text-violet-700",
  analysis_completed:            "bg-violet-100 text-violet-700",
  rewrite_generated:             "bg-indigo-100 text-indigo-700",
  billing_checkout_initiated:    "bg-orange-100 text-orange-700",
  billing_payment_confirmed:     "bg-emerald-100 text-emerald-700",
  billing_promo_applied:         "bg-yellow-100 text-yellow-700",
  admin_user_updated:            "bg-slate-100 text-slate-600",
  admin_wallet_adjusted:         "bg-amber-100 text-amber-700",
  admin_promo_created:           "bg-slate-100 text-slate-600",
  admin_promo_deleted:           "bg-rose-100 text-rose-600",
  smtp_connected:                "bg-teal-100 text-teal-700",
  smtp_deleted:                  "bg-rose-100 text-rose-600",
};

function EventBadge({ type }: { type: string }) {
  const label = EVENT_LABELS[type] ?? type.replace(/_/g, " ");
  const color = EVENT_COLORS[type] ?? "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      {label}
    </span>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const PAGE_SIZE = 50;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminActivityPage() {
  const [data, setData] = useState<AdminActivityFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    getAdminActivityFeed({
      search: debouncedSearch || undefined,
      event_type: eventType || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, eventType, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, eventType, dateFrom, dateTo]);

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  function clearFilters() {
    setSearch(""); setEventType(""); setDateFrom(""); setDateTo(""); setPage(1);
  }

  const hasFilters = search || eventType || dateFrom || dateTo;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] font-bold text-slate-900">Activity Feed</p>
            <p className="mt-0.5 text-xs text-slate-500">
              All user events — token refreshes and page views excluded
            </p>
          </div>
          {data && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {data.total.toLocaleString()} events
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Filter size={13} className="text-slate-400 shrink-0" />
          <p className="text-xs font-semibold text-slate-600">Filters</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
            >
              <X size={11} /> Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {/* Search */}
          <div className="relative sm:col-span-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Event type */}
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700"
          >
            <option value="">All event types</option>
            {(data?.event_types ?? []).map((et) => (
              <option key={et} value={et}>
                {EVENT_LABELS[et] ?? et.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          {/* Date from */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700"
          />

          {/* Date to */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="space-y-0 divide-y divide-slate-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : !data?.items.length ? (
          <p className="py-16 text-center text-sm text-slate-400">No events match your filters</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Event</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">User</th>
                <th className="hidden px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:table-cell">Detail</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item, i) => (
                <ActivityRow key={i} item={item} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} · {data?.total.toLocaleString()} total
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ActivityRow({ item }: { item: AdminActivityItem }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <EventBadge type={item.event_type} />
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/admin/users/${item.user_id}`}
          className="block hover:text-brand-700"
        >
          <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
            {item.user_name ?? item.user_email}
          </p>
          {item.user_name && (
            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.user_email}</p>
          )}
        </Link>
      </td>
      <td className="hidden px-4 py-3 sm:table-cell">
        <p className="text-xs text-slate-500 truncate max-w-[220px]">{item.detail ?? "—"}</p>
      </td>
      <td className="px-4 py-3 text-right">
        <p className="text-[10px] text-slate-400 whitespace-nowrap">{formatTime(item.created_at)}</p>
      </td>
    </tr>
  );
}
