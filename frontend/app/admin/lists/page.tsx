"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Upload } from "lucide-react";

import {
  addContact,
  bulkAddContacts,
  createList,
  deleteContact,
  deleteList,
  getListContacts,
  getLists,
  type AdminContactItem,
  type AdminListItem,
} from "@/lib/admin";

function NewListModal({ onClose, onCreated }: { onClose: () => void; onCreated: (list: AdminListItem) => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError("");
    try {
      const list = await createList({ name: name.trim(), description: desc.trim() || undefined });
      onCreated(list);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-sm font-bold text-slate-900 mb-4">New Distribution List</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
          <input type="text" placeholder="List name (e.g. Tech HR Contacts)" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" required />
          <input type="text" placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400" />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-600">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-50">{loading ? "…" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactsTable({ listId, onCountChange }: { listId: string; onCountChange: (delta: number) => void }) {
  const [contacts, setContacts] = useState<AdminContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", full_name: "", company_name: "", job_title: "" });
  const [bulkText, setBulkText] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    getListContacts(listId).then(setContacts).catch(() => {}).finally(() => setLoading(false));
  }, [listId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.email.includes("@")) { setAddError("Invalid email"); return; }
    setAddLoading(true); setAddError("");
    try {
      const c = await addContact(listId, { email: addForm.email, full_name: addForm.full_name || undefined, company_name: addForm.company_name || undefined, job_title: addForm.job_title || undefined });
      setContacts((p) => [...p, c]);
      setAddForm({ email: "", full_name: "", company_name: "", job_title: "" });
      onCountChange(1);
      setShowAddForm(false);
    } catch (err) { setAddError(err instanceof Error ? err.message : "Failed"); }
    finally { setAddLoading(false); }
  }

  async function handleBulk(e: React.FormEvent) {
    e.preventDefault();
    const emails = bulkText.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (emails.length === 0) return;
    setAddLoading(true); setAddError("");
    try {
      const { added } = await bulkAddContacts(listId, emails);
      onCountChange(added);
      setBulkText("");
      setShowBulk(false);
      const fresh = await getListContacts(listId);
      setContacts(fresh);
    } catch (err) { setAddError(err instanceof Error ? err.message : "Failed"); }
    finally { setAddLoading(false); }
  }

  async function handleDelete(contactId: string) {
    await deleteContact(listId, contactId).catch(() => {});
    setContacts((p) => p.filter((c) => c.id !== contactId));
    onCountChange(-1);
  }

  if (loading) return <p className="text-xs text-slate-400 px-4 py-3">Loading…</p>;

  return (
    <div className="border-t border-slate-100">
      <div className="flex gap-2 px-4 py-3">
        <button onClick={() => { setShowAddForm(!showAddForm); setShowBulk(false); }} className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white">
          <Plus size={11} /> Add Contact
        </button>
        <button onClick={() => { setShowBulk(!showBulk); setShowAddForm(false); }} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
          <Upload size={11} /> Bulk Import
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={(e) => void handleAdd(e)} className="px-4 pb-3 grid grid-cols-2 gap-2">
          <input type="email" placeholder="email@company.com *" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="col-span-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none" required />
          <input type="text" placeholder="Full name" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none" />
          <input type="text" placeholder="Company" value={addForm.company_name} onChange={(e) => setAddForm({ ...addForm, company_name: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none" />
          <input type="text" placeholder="Job title" value={addForm.job_title} onChange={(e) => setAddForm({ ...addForm, job_title: e.target.value })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none" />
          {addError && <p className="col-span-2 text-xs text-rose-600">{addError}</p>}
          <button type="submit" disabled={addLoading} className="col-span-2 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{addLoading ? "…" : "Add Contact"}</button>
        </form>
      )}

      {showBulk && (
        <form onSubmit={(e) => void handleBulk(e)} className="px-4 pb-3 space-y-2">
          <textarea rows={5} placeholder={"Paste emails separated by newline, comma, or semicolon:\nhr@company1.com\nrecruiter@company2.com"} value={bulkText} onChange={(e) => setBulkText(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none resize-none" />
          {addError && <p className="text-xs text-rose-600">{addError}</p>}
          <button type="submit" disabled={addLoading} className="w-full rounded-lg bg-slate-900 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{addLoading ? "Importing…" : "Import"}</button>
        </form>
      )}

      {contacts.length === 0 ? (
        <p className="px-4 pb-4 text-xs text-slate-400">No contacts yet.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Company</th>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-2 text-slate-700">{c.email}</td>
                <td className="px-4 py-2 text-slate-500">{c.full_name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{c.company_name ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{c.job_title ?? "—"}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => void handleDelete(c.id)} className="text-rose-400 hover:text-rose-600 transition">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminListsPage() {
  const [lists, setLists] = useState<AdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getLists().then(setLists).catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed")).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await deleteList(id).catch(() => {});
    setLists((p) => p.filter((l) => l.id !== id));
  }

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-bold text-slate-900">Distribution Lists</p>
          <p className="text-xs text-slate-500 mt-0.5">Manage shared HR contact lists for jobseeker campaigns.</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          <Plus size={14} /> New List
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {lists.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-500">No lists yet</p>
          <p className="text-xs text-slate-400 mt-1">Create a list and add HR contacts for jobseekers to use.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{list.name}</p>
                  {list.description && <p className="text-xs text-slate-500 mt-0.5">{list.description}</p>}
                  <p className="text-xs text-slate-400 mt-0.5">{list.total_count} contacts</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => setExpandedId(expandedId === list.id ? null : list.id)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50">
                    {expandedId === list.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Contacts
                  </button>
                  <button onClick={() => void handleDelete(list.id)} className="text-rose-400 hover:text-rose-600 transition p-1.5">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expandedId === list.id && (
                <ContactsTable
                  listId={list.id}
                  onCountChange={(delta) =>
                    setLists((p) => p.map((l) => l.id === list.id ? { ...l, total_count: l.total_count + delta } : l))
                  }
                />
              )}
            </div>
          ))}
        </div>
      )}

      {showNewModal && (
        <NewListModal
          onClose={() => setShowNewModal(false)}
          onCreated={(list) => { setLists((p) => [list, ...p]); setShowNewModal(false); }}
        />
      )}
    </div>
  );
}
