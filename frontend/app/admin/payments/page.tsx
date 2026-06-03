"use client";

import { useCallback, useEffect, useState } from "react";
import {
  activatePaymentOrder,
  bulkActivatePendingOrders,
  listAdminPaymentOrders,
  type AdminPaymentOrderItem,
} from "@/lib/admin";

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

function fmtAmount(minor: number, currency: string) {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

const STATUS_CLS: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  PAID:      "bg-teal-50 text-teal-700 border-teal-200",
  FAILED:    "bg-rose-50 text-rose-700 border-rose-200",
  CANCELED:  "bg-slate-100 text-slate-500 border-slate-200",
  REFUNDED:  "bg-purple-50 text-purple-700 border-purple-200",
};

export default function AdminPaymentsPage() {
  const [orders, setOrders]           = useState<AdminPaymentOrderItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [activating, setActivating]   = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast]             = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listAdminPaymentOrders({ status: statusFilter || undefined, limit: 100 });
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading orders");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { void load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  async function handleActivate(orderId: string) {
    setActivating(orderId);
    try {
      await activatePaymentOrder(orderId);
      showToast("✅ تم تفعيل الدفعة وإضافة الرصيد للمستخدم");
      await load();
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : "فشل التفعيل"}`);
    } finally {
      setActivating(null);
    }
  }

  async function handleBulkActivate() {
    if (!confirm("تفعيل جميع الطلبات المعلقة؟ تأكد أن جميعها مدفوعة من البنك قبل المتابعة.")) return;
    setBulkLoading(true);
    try {
      const result = await bulkActivatePendingOrders();
      showToast(`✅ تم تفعيل ${result.activated.length} طلب — ${result.failed.length} فشل — ${result.already_paid.length} مدفوع مسبقاً`);
      await load();
    } catch (e) {
      showToast(`❌ ${e instanceof Error ? e.message : "فشل التفعيل الجماعي"}`);
    } finally {
      setBulkLoading(false);
    }
  }

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">إدارة الدفعات</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            الطلبات المعلقة تعني أن Webhook لم يصل — فعّل يدوياً بعد تأكيد الخصم البنكي
          </p>
        </div>
        {pendingCount > 0 && statusFilter === "PENDING" && (
          <button
            type="button"
            disabled={bulkLoading}
            onClick={() => void handleBulkActivate()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-50"
          >
            {bulkLoading ? "جاري التفعيل…" : `⚡ تفعيل جميع المعلقة (${pendingCount})`}
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">الحالة</span>
        {["", "PENDING", "PAID", "FAILED", "CANCELED"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === s
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-brand-300"
            }`}
          >
            {s || "الكل"}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-300 transition"
        >
          ↻ تحديث
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">جاري التحميل…</div>
        ) : error ? (
          <div className="py-16 text-center text-sm text-rose-500">{error}</div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">لا توجد طلبات</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">المستخدم</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">الخدمة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">المبلغ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">الحالة</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">التاريخ</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-400">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{o.user_email}</p>
                      <p className="font-mono text-[10px] text-slate-400">{o.id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{o.plan_name}</p>
                      <p className="text-[11px] text-slate-400 capitalize">{o.order_type.replace(/_/g, " ")}</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 tabular-nums">
                      {fmtAmount(o.amount_minor, o.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[o.status] ?? STATUS_CLS.CANCELED}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {fmt(o.created_at)}
                      {o.paid_at && <p className="text-teal-600">دُفع: {fmt(o.paid_at)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {o.status === "PENDING" && (
                        <button
                          type="button"
                          disabled={activating === o.id}
                          onClick={() => void handleActivate(o.id)}
                          className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:opacity-50"
                        >
                          {activating === o.id ? "…" : "تفعيل"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
