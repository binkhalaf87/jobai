"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Plus, HeadphonesIcon, MessageSquare } from "lucide-react";
import { getMyTickets, type TicketResponse } from "@/lib/support";
import { TicketStatusBadge } from "@/components/support/ticket-status-badge";
import { CreateTicketModal } from "@/components/support/create-ticket-modal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function SupportPage() {
  const t = useTranslations("support");
  const [tickets, setTickets] = useState<TicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    try {
      const data = await getMyTickets();
      setTickets(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.load"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeadphonesIcon size={18} className="text-teal-600" />
          <h1 className="text-[17px] font-bold text-slate-900">{t("title")}</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-teal-700"
        >
          <Plus size={14} />
          {t("newTicket")}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <MessageSquare size={32} className="text-slate-300" />
          <p className="text-[14px] font-semibold text-slate-600">{t("noTickets")}</p>
          <p className="text-[12px] text-slate-400">{t("noTicketsDesc")}</p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-2 rounded-lg bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-teal-700"
          >
            {t("newTicket")}
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/dashboard/support/${ticket.id}`}
                className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-semibold text-slate-900">{ticket.subject}</span>
                    {ticket.unread_by_user && (
                      <span className="h-2 w-2 rounded-full bg-teal-500" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <TicketStatusBadge status={ticket.status} label={t(`status.${ticket.status}`)} />
                    <span className="text-[11px] text-slate-400">{t(`categories.${ticket.category}`)}</span>
                    <span className="text-[11px] text-slate-400">·</span>
                    <span className="text-[11px] text-slate-400">{formatDate(ticket.updated_at)}</span>
                  </div>
                </div>
                <div className="ms-3 flex-shrink-0 text-[11px] text-slate-400">
                  {ticket.message_count} {t("fields.message").toLowerCase()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <CreateTicketModal
          onClose={() => setShowModal(false)}
          onCreated={() => void load()}
        />
      )}
    </div>
  );
}
