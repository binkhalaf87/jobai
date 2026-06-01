"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Eye, EyeOff, Trash2, X } from "lucide-react";

import {
  createPromoCode,
  deletePromoCode,
  listPromoCodes,
  listPromoCodeUsages,
  patchPromoCode,
  type AdminPromoCodeCreate,
  type AdminPromoCodeItem,
  type AdminPromoCodeUsageItem,
} from "@/lib/admin";

type Filter = "all" | "active" | "inactive";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDiscount(item: AdminPromoCodeItem): string {
  if (item.discount_type === "percentage") {
    return `${(item.discount_value / 100).toFixed(0)}%`;
  }
  return `SAR ${(item.discount_value / 100).toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function isExpired(item: AdminPromoCodeItem): boolean {
  if (!item.valid_until) return false;
  return new Date(item.valid_until) < new Date();
}

// ── Badges ────────────────────────────────────────────────────────────────────

const AUDIENCE_COLORS: Record<string, string> = {
  all:       "bg-slate-100 text-slate-600",
  jobseeker: "bg-blue-100 text-blue-700",
  recruiter: "bg-violet-100 text-violet-700",
};

function AudienceBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold capitalize ${AUDIENCE_COLORS[value] ?? "bg-slate-100 text-slate-500"}`}>
      {value}
    </span>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({
  item,
  onConfirm,
  onCancel,
  loading,
}: {
  item: AdminPromoCodeItem;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
        <p className="text-[15px] font-bold text-slate-900">Delete promo code?</p>
        <p className="text-sm text-slate-600">
          Delete <span className="font-mono font-semibold">{item.code}</span>? This cannot be undone.
          {item.uses_count > 0 && (
            <span className="mt-1 block text-rose-600">
              This code has been used {item.uses_count} time(s) and cannot be deleted — deactivate it instead.
            </span>
          )}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || item.uses_count > 0}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Create modal ──────────────────────────────────────────────────────────────

const DEFAULT_FORM: AdminPromoCodeCreate = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  applicable_to: "all",
  plan_id: "",
  max_uses: undefined,
  max_uses_per_user: 1,
  valid_from: "",
  valid_until: "",
};

function CreateModal({
  onSave,
  onCancel,
  saving,
  error,
}: {
  onSave: (data: AdminPromoCodeCreate) => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<AdminPromoCodeCreate>(DEFAULT_FORM);

  function set<K extends keyof AdminPromoCodeCreate>(key: K, value: AdminPromoCodeCreate[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit() {
    const data: AdminPromoCodeCreate = {
      ...form,
      code: form.code.trim().toUpperCase(),
      plan_id: form.plan_id?.trim() || undefined,
      valid_from: form.valid_from?.trim() || undefined,
      valid_until: form.valid_until?.trim() || undefined,
      description: form.description?.trim() || undefined,
    };
    onSave(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4 my-auto">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-bold text-slate-900">New Promo Code</p>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <div className="space-y-3">
          {/* Code */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Code *</label>
            <input
              type="text"
              placeholder="SUMMER20"
              value={form.code}
              onChange={(e) => set("code", e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
            <input
              type="text"
              placeholder="Internal note (optional)"
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Discount type + value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Discount Type *</label>
              <select
                value={form.discount_type}
                onChange={(e) => set("discount_type", e.target.value as "percentage" | "fixed_amount")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed_amount">Fixed Amount (SAR)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {form.discount_type === "percentage" ? "Value (basis pts, e.g. 2000=20%)" : "Value (halalas, e.g. 1000=SAR 10)"}
              </label>
              <input
                type="number"
                min={1}
                value={form.discount_value}
                onChange={(e) => set("discount_value", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Applicable to */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Applies To</label>
            <select
              value={form.applicable_to}
              onChange={(e) => set("applicable_to", e.target.value as "all" | "jobseeker" | "recruiter")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="all">All users</option>
              <option value="jobseeker">Jobseekers only</option>
              <option value="recruiter">Recruiters only</option>
            </select>
          </div>

          {/* Plan ID */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Plan ID (optional — leave blank for any plan)</label>
            <input
              type="text"
              placeholder="e.g. recruiter_starter_monthly"
              value={form.plan_id ?? ""}
              onChange={(e) => set("plan_id", e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>

          {/* Max uses + per user */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min={1}
                placeholder="∞"
                value={form.max_uses ?? ""}
                onChange={(e) => set("max_uses", e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Max Uses Per User</label>
              <input
                type="number"
                min={1}
                value={form.max_uses_per_user ?? 1}
                onChange={(e) => set("max_uses_per_user", Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>

          {/* Validity dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Valid From</label>
              <input
                type="datetime-local"
                value={form.valid_from ?? ""}
                onChange={(e) => set("valid_from", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Valid Until</label>
              <input
                type="datetime-local"
                value={form.valid_until ?? ""}
                onChange={(e) => set("valid_until", e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onCancel} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.code.trim()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create Code"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Usage sub-row ─────────────────────────────────────────────────────────────

function UsageSubRow({ usages, loading }: { usages: AdminPromoCodeUsageItem[] | null; loading: boolean }) {
  return (
    <tr>
      <td colSpan={7} className="bg-slate-50 px-4 py-3">
        {loading ? (
          <div className="h-8 animate-pulse rounded bg-slate-200" />
        ) : !usages || usages.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">No usages yet.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-4 font-semibold">User Email</th>
                <th className="py-1 pr-4 font-semibold">Name</th>
                <th className="py-1 pr-4 font-semibold">Discount Applied</th>
                <th className="py-1 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usages.map((u) => (
                <tr key={u.id}>
                  <td className="py-1 pr-4 font-mono text-slate-700">{u.user_email}</td>
                  <td className="py-1 pr-4 text-slate-600">{u.user_name ?? "—"}</td>
                  <td className="py-1 pr-4 text-slate-700">SAR {(u.discount_applied_minor / 100).toFixed(2)}</td>
                  <td className="py-1 text-slate-500">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </td>
    </tr>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const [codes, setCodes] = useState<AdminPromoCodeItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPromoCodeItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [usageCache, setUsageCache] = useState<Record<string, AdminPromoCodeUsageItem[]>>({});
  const [usageLoading, setUsageLoading] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listPromoCodes();
      setCodes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load promo codes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const displayed = codes.filter((c) => {
    if (filter === "active") return c.is_active;
    if (filter === "inactive") return !c.is_active;
    return true;
  });

  const totalUses = codes.reduce((s, c) => s + c.uses_count, 0);
  const activeCount = codes.filter((c) => c.is_active).length;

  async function handleCreate(data: AdminPromoCodeCreate) {
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createPromoCode(data);
      setCodes((prev) => [created, ...prev]);
      setShowCreate(false);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: AdminPromoCodeItem) {
    setToggling(item.id);
    try {
      const updated = await patchPromoCode(item.id, { is_active: !item.is_active });
      setCodes((prev) => prev.map((c) => (c.id === item.id ? updated : c)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromoCode(deleteTarget.id);
      setCodes((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  }

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (usageCache[id]) return;
    setUsageLoading(id);
    try {
      const data = await listPromoCodeUsages(id);
      setUsageCache((prev) => ({ ...prev, [id]: data }));
    } catch {
      setUsageCache((prev) => ({ ...prev, [id]: [] }));
    } finally {
      setUsageLoading(null);
    }
  }

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all",      label: "All" },
    { key: "active",   label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-5">
      {showCreate && (
        <CreateModal
          onSave={(data) => void handleCreate(data)}
          onCancel={() => { setShowCreate(false); setSaveError(null); }}
          saving={saving}
          error={saveError}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          item={deleteTarget}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Codes",  value: codes.length },
          { label: "Active Codes", value: activeCount },
          { label: "Total Uses",   value: totalUses },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={[
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                filter === key ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setShowCreate(true); setSaveError(null); }}
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
        >
          <Plus size={13} />
          New Code
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
          <Tag size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No promo codes found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Applies To</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Uses</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Validity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((item) => (
                <>
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-[13px] font-semibold text-slate-900">{item.code}</p>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">{item.description}</p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-700">
                      {formatDiscount(item)}
                    </td>

                    {/* Applies To */}
                    <td className="px-4 py-3">
                      <AudienceBadge value={item.applicable_to} />
                      {item.plan_name && (
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{item.plan_name}</p>
                      )}
                    </td>

                    {/* Uses */}
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-slate-700">
                        {item.uses_count}
                        <span className="text-slate-400"> / {item.max_uses ?? "∞"}</span>
                      </p>
                      {item.max_uses !== null && item.max_uses > 0 && (
                        <div className="mt-1 h-1 w-20 rounded-full bg-slate-100">
                          <div
                            className="h-1 rounded-full bg-slate-500"
                            style={{ width: `${Math.min(100, (item.uses_count / item.max_uses) * 100)}%` }}
                          />
                        </div>
                      )}
                    </td>

                    {/* Validity */}
                    <td className="px-4 py-3 text-[12px]">
                      {!item.valid_from && !item.valid_until ? (
                        <span className="text-slate-400">No limit</span>
                      ) : isExpired(item) ? (
                        <span className="text-rose-500 font-semibold">Expired</span>
                      ) : (
                        <span className="text-slate-600">
                          {formatDate(item.valid_from)} → {formatDate(item.valid_until)}
                        </span>
                      )}
                    </td>

                    {/* Status toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleToggle(item)}
                        disabled={toggling === item.id}
                        className={[
                          "rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all disabled:opacity-50",
                          item.is_active
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-rose-100 text-rose-600 hover:bg-rose-200",
                        ].join(" ")}
                      >
                        {toggling === item.id ? "…" : item.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => void handleExpand(item.id)}
                          title="View usages"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        >
                          {expandedId === item.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedId === item.id && (
                    <UsageSubRow
                      key={`${item.id}-usages`}
                      usages={usageCache[item.id] ?? null}
                      loading={usageLoading === item.id}
                    />
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
