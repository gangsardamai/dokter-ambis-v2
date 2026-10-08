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
  compact?: boolean;
};

export default function StudentLearningMonitor({ courseId, folders, lessons, completedLessonIds, initialFolderIds, compact = false }: Props) {
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
    <section aria-label="Monitoring Belajar" className={compact ? "min-w-0 rounded-2xl border border-white/15 bg-white/10 p-3 text-white shadow-inner shadow-black/5 backdrop-blur-sm" : "rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-950/5 sm:p-6"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={compact ? "text-sm font-black text-white" : "text-xs font-black uppercase tracking-[0.18em] text-blue-700"}>Monitoring Belajar</p>
          
          
        </div>
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className={compact ? "min-h-8 shrink-0 rounded-xl border border-white/20 bg-white/15 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/25" : "min-h-10 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-100"}>
          Atur Target {expanded ? "▴" : "▾"} {selected.length ? "(" + selected.length + ")" : ""}
        </button>
      </div>
      {expanded && (
        <div className="mt-3 min-w-0 max-w-full space-y-1 rounded-xl border border-blue-100 bg-slate-50 p-3 text-slate-700">
          <p className="mb-2 text-[11px] font-bold leading-4 text-slate-700">Pilih satu atau beberapa folder</p>
          {folders.map(folder => (
            <label key={folder.id} className="flex w-full min-w-0 cursor-pointer items-start gap-2 rounded-md px-1 py-1.5 text-[11px] font-medium leading-4 text-slate-700 hover:bg-white">
              <input type="checkbox" checked={selected.includes(folder.id)} disabled={pending} onChange={() => changeFolder(folder.id)} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-blue-600" />
              <span className="block min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere]">{folder.title}</span>
            </label>
          ))}
          {folders.length === 0 && <p className="text-sm text-slate-500">Folder belum tersedia.</p>}
          <div role="status" aria-live="polite" className="flex min-w-0 min-h-6 items-center gap-2 text-[11px] leading-4 font-semibold [overflow-wrap:anywhere]">
            {pending ? (
              <><svg aria-hidden="true" className="h-4 w-4 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><span className="text-blue-700">Menyimpan pilihan target...</span></>
            ) : saved && !error ? (
              <><span aria-hidden="true" className="text-emerald-600">✓</span><span className="text-emerald-700">Target berhasil disimpan</span></>
            ) : (
              <span className="text-slate-500">Pilihan otomatis tersimpan untuk akun Anda. Subfolder dari folder yang dipilih ikut dihitung.</span>
            )}
          </div>
          {error && <p role="alert" className="text-sm font-semibold text-red-600 ">{error}</p>}
        </div>
      )}
      <div className={compact ? "mt-2 flex items-end justify-between gap-3" : "mt-5 flex items-end justify-between gap-4"}>
        <div><p className={compact ? "text-xs font-semibold text-blue-100" : "text-sm font-semibold text-slate-500"}>Lesson selesai</p><p className={compact ? "text-2xl font-black text-white" : "text-3xl font-black text-slate-950"}>{done} <span className={compact ? "text-base text-blue-100" : "text-lg text-slate-400"}>/ {total}</span></p></div>
        <p className={compact ? "text-xl font-black text-white" : "text-2xl font-black text-blue-700"}>{percentage}%</p>
      </div>
      <div role="progressbar" aria-label="Progres lesson target" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className={compact ? "mt-1 h-2 overflow-hidden rounded-full bg-white/25" : "mt-3 h-3 overflow-hidden rounded-full bg-blue-100"}>
        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-400 transition-all" style={{ width: percentage + "%" }} />
      </div>
      <p className={compact ? "mt-1 text-xs font-semibold text-blue-100" : "mt-2 text-xs font-semibold text-slate-500"}>{total === 0 ? "Belum ada lesson dalam target folder ini." : (total - done) + " lesson belum selesai"}</p>
    </section>
  );
}
