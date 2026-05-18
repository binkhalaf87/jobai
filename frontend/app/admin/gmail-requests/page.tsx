"use client";

import { useEffect, useState } from "react";
import { Mail, CheckCircle, XCircle, Clock } from "lucide-react";

import {
  approveGmailRequest,
  listGmailRequests,
  rejectGmailRequest,
  type AdminGmailRequestItem,
} from "@/lib/admin";

type FilterStatus = "all" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:  "bg-amber-100 text-amber-700 border border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    rejected: "bg-rose-100 text-rose-600 border border-rose-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status === "pending"  && <Clock size={10} />}
      {status === "approved" && <CheckCircle size={10} />}
      {status === "rejected" && <XCircle size={10} />}
      {status}
    </span>
  );
}

function RejectModal({
  request,
  onConfirm,
  onCancel,
}: {
  request: AdminGmailRequestItem;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <p className="text-[15px] font-bold text-slate-900">Reject request</p>
        <p className="text-sm text-slate-600">
          Rejecting Gmail access for <strong>{request.user_email}</strong>.
        </p>
        <textarea
          rows={3}
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GmailRequestsPage() {
  const [requests, setRequests] = useState<AdminGmailRequestItem[]>([]);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<AdminGmailRequestItem | null>(null);

  async function load(status: FilterStatus) {
    setLoading(true);
    setError(null);
    try {
      const data = await listGmailRequests(status === "all" ? undefined : status);
      setRequests(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(filter); }, [filter]);

  async function handleApprove(id: string) {
    setActing(id);
    try {
      const updated = await approveGmailRequest(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to approve");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(id: string, reason: string) {
    setRejectTarget(null);
    setActing(id);
    try {
      const updated = await rejectGmailRequest(id, reason || undefined);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reject");
    } finally {
      setActing(null);
    }
  }

  const FILTERS: FilterStatus[] = ["pending", "approved", "rejected", "all"];

  return (
    <div className="space-y-5">
      {rejectTarget && (
        <RejectModal
          request={rejectTarget}
          onConfirm={(reason) => void handleReject(rejectTarget.id, reason)}
          onCancel={() => setRejectTarget(null)}
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Gmail Access Requests</p>
          <p className="mt-0.5 text-xs text-slate-500">Review and approve user requests to connect Gmail.</p>
        </div>
        <Mail size={18} className="text-slate-400" />
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all",
              filter === f
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-400">
          No {filter === "all" ? "" : filter} requests found.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Requested</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Reviewed</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 text-[13px]">{req.user_name ?? req.user_email}</p>
                    <p className="text-xs text-slate-400">{req.user_email}</p>
                    {req.rejection_reason && (
                      <p className="mt-0.5 text-xs text-rose-500">Reason: {req.rejection_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {req.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => void handleApprove(req.id)}
                          disabled={acting === req.id}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {acting === req.id ? "…" : "Approve"}
                        </button>
                        <button
                          onClick={() => setRejectTarget(req)}
                          disabled={acting === req.id}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
