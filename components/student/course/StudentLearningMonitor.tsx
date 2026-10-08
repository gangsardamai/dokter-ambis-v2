"use client";

import { useState, useTransition } from "react";
import { saveLearningTargetsAction } from "@/app/actions/learning-targets.actions";

type Folder = { id: string; title: string; parent_folder_id: string | null };
type Lesson = { id: string; folder_id: string | null };
type Props = {
  courseId: string;
  folders: Folder[];
  lessons: Lesson[];
  completedLessonIds: string[];
  initialFolderIds: string[] | null;
};

export default function StudentLearningMonitor({ courseId, folders, lessons, completedLessonIds, initialFolderIds }: Props) {
  const defaults = folders.filter(f => /rangkuman\s*ppt/i.test(f.title) && /2026/.test(f.title)).map(f => f.id);
  const [selected, setSelected] = useState<string[]>(initialFolderIds ?? (defaults.length ? defaults : folders.length ? [folders[0].id] : []));
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const completed = new Set(completedLessonIds);
  const targetIds = new Set(selected);
  let changed = true;
  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (folder.parent_folder_id && targetIds.has(folder.parent_folder_id) && !targetIds.has(folder.id)) {
        targetIds.add(folder.id);
        changed = true;
      }
    }
  }
  const targetedLessons = lessons.filter(lesson => lesson.folder_id && targetIds.has(lesson.folder_id));
  const total = targetedLessons.length;
  const done = targetedLessons.filter(lesson => completed.has(lesson.id)).length;
  const percentage = total ? Math.round(done / total * 100) : 0;

  function changeFolder(id: string) {
    const next = selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
    setSelected(next);
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await saveLearningTargetsAction(courseId, next);
        setSaved(true);
      } catch (err) {
        setSelected(selected);
        setError(err instanceof Error ? err.message : "Gagal menyimpan target. Silakan coba lagi.");
      }
    });
  }

  return (
    <section aria-label="Monitoring Belajar" className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">Monitoring Belajar</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">Progres Lesson</h2>
          <p className="mt-1 text-sm text-slate-500">Target berdasarkan folder pilihan Anda. Lesson dihitung selesai setelah ditandai “Selesai Dipelajari”.</p>
        </div>
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="min-h-10 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100">
          Atur Target {expanded ? "▴" : "▾"} {selected.length ? "(" + selected.length + ")" : ""}
        </button>
      </div>
      {expanded && (
        <fieldset className="mt-4 grid gap-2 rounded-2xl border border-blue-100 bg-slate-50 p-4 sm:grid-cols-2">
          <legend className="px-1 text-sm font-bold text-slate-700">Pilih satu atau beberapa folder</legend>
          {folders.map(folder => (
            <label key={folder.id} className="flex cursor-pointer items-center gap-2 rounded-lg p-2 text-sm font-semibold text-slate-700 hover:bg-white">
              <input type="checkbox" checked={selected.includes(folder.id)} disabled={pending} onChange={() => changeFolder(folder.id)} className="h-4 w-4 accent-blue-600" />
              <span className="break-words">{folder.title}</span>
            </label>
          ))}
          {folders.length === 0 && <p className="text-sm text-slate-500">Folder belum tersedia.</p>}
          <div role="status" aria-live="polite" className="flex min-h-6 items-center gap-2 text-xs font-semibold sm:col-span-2">
            {pending ? (
              <><svg aria-hidden="true" className="h-4 w-4 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><span className="text-blue-700">Menyimpan pilihan target...</span></>
            ) : saved && !error ? (
              <><span aria-hidden="true" className="text-emerald-600">✓</span><span className="text-emerald-700">Target berhasil disimpan</span></>
            ) : (
              <span className="text-slate-500">Pilihan otomatis tersimpan untuk akun Anda. Subfolder dari folder yang dipilih ikut dihitung.</span>
            )}
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-red-600 sm:col-span-2">{error}</p>}
        </fieldset>
      )}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div><p className="text-sm font-semibold text-slate-500">Lesson selesai</p><p className="text-3xl font-black text-slate-950">{done} <span className="text-lg text-slate-400">/ {total}</span></p></div>
        <p className="text-2xl font-black text-blue-700">{percentage}%</p>
      </div>
      <div role="progressbar" aria-label="Progres lesson target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="mt-3 h-3 overflow-hidden rounded-full bg-blue-100">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-400 transition-all" style={{ width: percentage + "%" }} />
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-500">{total === 0 ? "Belum ada lesson dalam target folder ini." : (total - done) + " lesson belum selesai"}</p>
    </section>
  );
}
