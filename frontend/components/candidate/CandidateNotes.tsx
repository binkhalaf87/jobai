"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { fmtDate } from "./utils";

type Note = { id: string; text: string; date: string };

type Props = { candidateId: string };

export function CandidateNotes({ candidateId }: Props) {
  const t = useTranslations("recruiter.candidateDetailPage");
  const storageKey = `jobai_notes_${candidateId}`;
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setNotes(JSON.parse(raw) as Note[]);
    } catch { /* ignore */ }
  }, [storageKey]);

  function saveNotes(updated: Note[]) {
    setNotes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function addNote() {
    if (!draft.trim()) return;
    const note: Note = {
      id: Math.random().toString(36).slice(2),
      text: draft.trim(),
      date: new Date().toISOString(),
    };
    saveNotes([note, ...notes]);
    setDraft("");
  }

  function deleteNote(id: string) {
    saveNotes(notes.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t("notes.placeholder")}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400"
        />
        <div className="mt-2 flex justify-end">
          <button type="button" onClick={addNote} disabled={!draft.trim()}
            className="rounded-xl bg-brand-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-40">
            {t("notes.save")}
          </button>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-center text-xs text-slate-400">{t("notes.empty")}</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-6 text-slate-800">{note.text}</p>
                <button type="button" onClick={() => deleteNote(note.id)}
                  className="flex-shrink-0 text-xs text-slate-300 transition hover:text-rose-400">
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{fmtDate(note.date)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
