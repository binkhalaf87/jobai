"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import type { MessageResponse, TicketDetailResponse, TicketStatus } from "@/lib/support";

type Props = {
  ticket: TicketDetailResponse;
  isAdmin?: boolean;
  onSend: (body: string) => Promise<MessageResponse>;
  onStatusChange?: (status: TicketStatus) => void;
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function TicketChat({ ticket, isAdmin, onSend, onStatusChange }: Props) {
  const t = useTranslations("support");
  const [messages, setMessages] = useState<MessageResponse[]>(ticket.messages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const msg = await onSend(text);
      setMessages((prev) => [...prev, msg]);
      setBody("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.send"));
    } finally {
      setSending(false);
    }
  }

  const isClosed = ticket.status === "closed";

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((msg) => {
          const isAdminMsg = msg.is_admin_message;
          return (
            <div key={msg.id} className={`flex ${isAdminMsg ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
                isAdminMsg
                  ? "rounded-tl-sm bg-white border border-slate-200"
                  : "rounded-tr-sm bg-teal-600 text-white"
              }`}>
                {isAdminMsg && (
                  <p className="mb-1 text-[10px] font-semibold text-teal-700">
                    {msg.sender_name ?? "Support"}
                  </p>
                )}
                <p className={`whitespace-pre-line text-[13px] leading-snug ${isAdminMsg ? "text-slate-800" : "text-white"}`}>
                  {msg.body}
                </p>
                <p className={`mt-1 text-[10px] ${isAdminMsg ? "text-slate-400" : "text-teal-100"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-[12px] text-slate-400">{t("noTickets")}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Status actions for admin */}
      {isAdmin && onStatusChange && (
        <div className="border-t border-slate-100 px-4 py-2 flex gap-2 flex-wrap">
          {(["open", "in_progress", "resolved", "closed"] as TicketStatus[])
            .filter((s) => s !== ticket.status)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(s)}
                className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                → {t(`status.${s}`)}
              </button>
            ))}
        </div>
      )}

      {/* Input */}
      {!isClosed ? (
        <form onSubmit={handleSend} className="border-t border-slate-100 p-3">
          {error && (
            <p className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] text-rose-700">{error}</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("typeMessage")}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSend(e); }
              }}
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={sending || !body.trim()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      ) : (
        <div className="border-t border-slate-100 p-3 text-center text-[12px] text-slate-400">
          {t("status.closed")}
        </div>
      )}
    </div>
  );
}
