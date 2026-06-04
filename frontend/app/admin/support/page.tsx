"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { adminGetTickets, type AdminTicketResponse, type TicketStatus } from "@/lib/support";
import { TicketStatusBadge } from "@/components/support/ticket-status-badge";

const STATUSES: Array<{ key: string; status?: TicketStatus }> = [
  { key: "filterAll" },
  { key: "filterOpen", status: "open" },
  { key: "filterInProgress", status: "in_progress" },
  { key: "filterResolved", status: "resolved" },
  { key: "filterClosed", status: "closed" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function AdminSupportPage() {
  const t = useTranslations("support");
  const [tickets, setTickets] = useState<AdminTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(undefined);

  async function load() {
    setLoading(true);
    try {
      const data = await adminGetTickets({ status: statusFilter, search: search || undefined });
      setTickets(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [statusFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    void load();
  }

  return (
    <div>
      <h1 className="mb-5 text-[17px] font-bold text-slate-900">{t("admin.title")}</h1>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-1.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[12.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-700"
          >
            Go
          </button>
        </form>

        <div className="flex gap-1">
          {STATUSES.map(({ key, status }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={[
                "rounded-full px-3 py-1 text-[11px] font-semibold transition",
                statusFilter === status
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              ].join(" ")}
            >
              {t(`admin.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
        </div>
      ) : tickets.length === 0 ? (
        <p className="text-[13px] text-slate-400">{t("noTickets")}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-[12.5px]">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">Subject</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">{t("admin.user")}</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">Category</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">{t("admin.messages")}</th>
                <th className="px-4 py-3 text-start font-semibold text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="font-semibold text-slate-900 hover:text-teal-700 hover:underline"
                    >
                      <span className="flex items-center gap-1.5">
                        {ticket.unread_by_admin && <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />}
                        {ticket.subject}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{ticket.user_email}</td>
                  <td className="px-4 py-3 text-slate-500">{t(`categories.${ticket.category}`)}</td>
                  <td className="px-4 py-3">
                    <TicketStatusBadge status={ticket.status} label={t(`status.${ticket.status}`)} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">{ticket.message_count}</td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(ticket.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
