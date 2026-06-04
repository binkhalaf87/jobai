"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import {
  adminGetTicket,
  adminReply,
  adminUpdateStatus,
  type TicketDetailResponse,
  type TicketStatus,
} from "@/lib/support";
import { TicketStatusBadge } from "@/components/support/ticket-status-badge";
import { TicketChat } from "@/components/support/ticket-chat";

export default function AdminTicketDetailPage() {
  const t = useTranslations("support");
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<TicketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetTicket(ticketId)
      .then(setTicket)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : t("errors.load")))
      .finally(() => setLoading(false));
  }, [ticketId, t]);

  async function handleStatusChange(status: TicketStatus) {
    try {
      await adminUpdateStatus(ticketId, status);
      setTicket((prev) => prev ? { ...prev, status } : prev);
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-100 mb-4" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          {error ?? t("errors.load")}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: "calc(100vh - 130px)" }}>
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <Link href="/admin/support" className="mt-0.5 flex-shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] font-bold text-slate-900">{ticket.subject}</h1>
          <div className="mt-1 flex items-center gap-2">
            <TicketStatusBadge status={ticket.status} label={t(`status.${ticket.status}`)} />
            <span className="text-[11px] text-slate-400">{t(`categories.${ticket.category}`)}</span>
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        <TicketChat
          ticket={ticket}
          isAdmin
          onSend={(body) => adminReply(ticketId, body)}
          onStatusChange={handleStatusChange}
        />
      </div>
    </div>
  );
}
