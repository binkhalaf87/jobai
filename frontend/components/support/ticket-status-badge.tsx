import type { TicketStatus } from "@/lib/support";

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-slate-100 text-slate-500",
};

type Props = { status: TicketStatus; label: string };

export function TicketStatusBadge({ status, label }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${STATUS_STYLES[status]}`}>
      {label}
    </span>
  );
}
