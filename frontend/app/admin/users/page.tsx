"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronLeft, ChevronRight, Coins } from "lucide-react";

import {
  listAdminUsers,
  patchAdminUser,
  adjustWallet,
  type AdminUserItem,
} from "@/lib/admin";

const ROLES = ["", "jobseeker", "recruiter", "admin"] as const;
const ROLE_LABELS: Record<string, string> = {
  "": "All roles",
  jobseeker: "Jobseeker",
  recruiter: "Recruiter",
  admin: "Admin",
};
const ROLE_COLORS: Record<string, string> = {
  jobseeker: "bg-brand-100 text-brand-700",
  recruiter: "bg-violet-100 text-violet-700",
  admin: "bg-slate-800 text-white",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_COLORS[role] ?? "bg-slate-100 text-slate-600"}`}>
      {role}
    </span>
  );
}

function WalletModal({
  user,
  onClose,
  onDone,
}: {
  user: AdminUserItem;
  onClose: () => void;
  onDone: (balance: number) => void;
}) {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(points, 10);
    if (!n || isNaN(n)) { setError("Enter a non-zero integer (+ to credit, - to debit)."); return; }
    if (!reason.trim()) { setError("Reason is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await adjustWallet(user.id, { points: n, reason: reason.trim() });
      onDone(res.balance_points);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-sm font-bold text-slate-900">Adjust Wallet</p>
        <p className="mt-0.5 text-xs text-slate-500">{user.email} — current: {user.balance_points ?? 0} pts</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <input
            type="number"
            placeholder="+100 or -50"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <input
            type="text"
            placeholder="Reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "…" : "Apply"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletUser, setWalletUser] = useState<AdminUserItem | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function load(p: number, q: string, role: string) {
    setLoading(true);
    setError(null);
    listAdminUsers({ search: q || undefined, role: role || undefined, page: p, pageSize: PAGE_SIZE })
      .then((res) => { setUsers(res.users); setTotal(res.total); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page, search, roleFilter); }, [page, roleFilter]);

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(1, v, roleFilter), 350);
  }

  async function toggleActive(user: AdminUserItem) {
    try {
      const updated = await patchAdminUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    } catch { /* ignore */ }
  }

  async function changeRole(user: AdminUserItem, role: string) {
    try {
      const updated = await patchAdminUser(user.id, { role });
      setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        >
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {error && (
          <div className="px-5 py-4 text-sm text-rose-600">{error}</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900 text-[13px]">{u.full_name ?? "—"}</p>
                    <p className="text-[11px] text-slate-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => void changeRole(u, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold outline-none focus:border-slate-400"
                    >
                      {["jobseeker", "recruiter", "admin"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => void toggleActive(u)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${
                        u.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-slate-600">
                    {u.balance_points ?? 0}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-400">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setWalletUser(u)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-amber-300 hover:text-amber-700"
                    >
                      <Coins size={11} />
                      Points
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <p className="text-xs text-slate-400">{total} users</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-2 text-xs font-semibold text-slate-600">{page} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wallet modal */}
      {walletUser && (
        <WalletModal
          user={walletUser}
          onClose={() => setWalletUser(null)}
          onDone={(balance) => {
            setUsers((prev) => prev.map((u) => u.id === walletUser.id ? { ...u, balance_points: balance } : u));
            setWalletUser(null);
          }}
        />
      )}
    </div>
  );
}
