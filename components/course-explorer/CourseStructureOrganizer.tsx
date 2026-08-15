"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DragEvent } from "react";

import {
  saveExplorerOrderAction,
  type ExplorerManagerRole,
} from "@/app/dashboard/explorer-order-actions";
import type {
  CourseExplorerContent,
  ExplorerLessonContent,
} from "@/types/course-explorer";

interface Props {
  courseId: string;
  content: CourseExplorerContent;
  managerRole: ExplorerManagerRole;
}

type Dragged =
  | { kind: "folder"; id: string }
  | { kind: "lesson"; id: string }
  | null;

type SaveState = "idle" | "saving" | "saved" | "error";

function normalize(content: CourseExplorerContent): CourseExplorerContent {
  return {
    folders: content.folders.map((group, folderIndex) => ({
      folder: { ...group.folder, folder_order: folderIndex + 1 },
      lessons: group.lessons.map((item, lessonIndex) => ({
        ...item,
        lesson: {
          ...item.lesson,
          folder_id: group.folder.id,
          lesson_order: lessonIndex + 1,
        },
      })),
    })),
    ungroupedLessons: content.ungroupedLessons.map((item, lessonIndex) => ({
      ...item,
      lesson: {
        ...item.lesson,
        folder_id: null,
        lesson_order: lessonIndex + 1,
      },
    })),
  };
}

function detachLesson(content: CourseExplorerContent, lessonId: string) {
  let lesson: ExplorerLessonContent | null = null;
  const folders = content.folders.map((group) => ({
    ...group,
    lessons: group.lessons.filter((item) => {
      if (item.lesson.id !== lessonId) return true;
      lesson = item;
      return false;
    }),
  }));
  const ungroupedLessons = content.ungroupedLessons.filter((item) => {
    if (item.lesson.id !== lessonId) return true;
    lesson = item;
    return false;
  });

  return { content: { folders, ungroupedLessons }, lesson };
}

function moveFolder(
  content: CourseExplorerContent,
  draggedId: string,
  targetId: string | null,
) {
  const folders = [...content.folders];
  const from = folders.findIndex((group) => group.folder.id === draggedId);
  if (from < 0) return null;
  if (targetId === draggedId) return null;

  const [dragged] = folders.splice(from, 1);
  if (targetId === null) {
    folders.push(dragged);
  } else {
    const to = folders.findIndex((group) => group.folder.id === targetId);
    if (to < 0) return null;
    folders.splice(to, 0, dragged);
  }

  return normalize({ ...content, folders });
}

function moveLessonBefore(
  content: CourseExplorerContent,
  draggedId: string,
  targetId: string,
) {
  if (draggedId === targetId) return null;
  const detached = detachLesson(content, draggedId);
  if (!detached.lesson) return null;

  let inserted = false;
  const folders = detached.content.folders.map((group) => {
    const index = group.lessons.findIndex((item) => item.lesson.id === targetId);
    if (index < 0) return group;
    const lessons = [...group.lessons];
    lessons.splice(index, 0, detached.lesson!);
    inserted = true;
    return { ...group, lessons };
  });

  let ungroupedLessons = detached.content.ungroupedLessons;
  if (!inserted) {
    const index = ungroupedLessons.findIndex((item) => item.lesson.id === targetId);
    if (index >= 0) {
      ungroupedLessons = [...ungroupedLessons];
      ungroupedLessons.splice(index, 0, detached.lesson);
      inserted = true;
    }
  }

  return inserted ? normalize({ folders, ungroupedLessons }) : null;
}

function moveLessonToEnd(
  content: CourseExplorerContent,
  draggedId: string,
  folderId: string | null,
) {
  const detached = detachLesson(content, draggedId);
  if (!detached.lesson) return null;

  if (folderId === null) {
    return normalize({
      ...detached.content,
      ungroupedLessons: [...detached.content.ungroupedLessons, detached.lesson],
    });
  }

  if (!detached.content.folders.some((group) => group.folder.id === folderId)) {
    return null;
  }

  return normalize({
    ...detached.content,
    folders: detached.content.folders.map((group) =>
      group.folder.id === folderId
        ? { ...group, lessons: [...group.lessons, detached.lesson!] }
        : group,
    ),
  });
}

function buildPayload(content: CourseExplorerContent) {
  return {
    folderIds: content.folders.map((group) => group.folder.id),
    lessonGroups: [
      ...content.folders.map((group) => ({
        folderId: group.folder.id,
        lessonIds: group.lessons.map((item) => item.lesson.id),
      })),
      {
        folderId: null,
        lessonIds: content.ungroupedLessons.map((item) => item.lesson.id),
      },
    ],
  };
}

function Handle({
  label,
  disabled,
  onDragStart,
  onDragEnd,
}: {
  label: string;
  disabled: boolean;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable={!disabled}
      disabled={disabled}
      aria-label={label}
      title={label}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="grid h-9 w-9 shrink-0 cursor-grab place-items-center rounded-xl border border-slate-200 bg-white font-black text-slate-500 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-wait disabled:opacity-50"
    >
      ⋮⋮
    </button>
  );
}

export default function CourseStructureOrganizer({
  courseId,
  content,
  managerRole,
}: Props) {
  const router = useRouter();
  const [structure, setStructure] = useState(() => normalize(content));
  const [dragged, setDragged] = useState<Dragged>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const isSaving = saveState === "saving";

  useEffect(() => {
    if (!isSaving) setStructure(normalize(content));
  }, [content, isSaving]);

  function startDrag(
    event: DragEvent<HTMLButtonElement>,
    item: Exclude<Dragged, null>,
  ) {
    if (isSaving) return;
    setDragged(item);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${item.kind}:${item.id}`);
  }

  function allowDrop(event: DragEvent<HTMLElement>, kind: "folder" | "lesson") {
    if (isSaving || dragged?.kind !== kind) return false;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    return true;
  }

  async function persist(previous: CourseExplorerContent, next: CourseExplorerContent) {
    setStructure(next);
    setSaveState("saving");
    setMessage("");

    const payload = buildPayload(next);
    const result = await saveExplorerOrderAction({
      managerRole,
      courseId,
      folderIds: payload.folderIds,
      lessonGroups: payload.lessonGroups,
    });

    if (!result.success) {
      setStructure(previous);
      setSaveState("error");
      setMessage(result.message);
      return;
    }

    setSaveState("saved");
    setMessage(result.message);
    router.refresh();
    window.setTimeout(() => setSaveState("idle"), 1800);
  }

  function dropFolder(event: DragEvent<HTMLElement>, targetId: string | null) {
    if (!allowDrop(event, "folder") || !dragged || dragged.kind !== "folder") return;
    event.stopPropagation();
    const previous = structure;
    const next = moveFolder(previous, dragged.id, targetId);
    setDragged(null);
    if (next) void persist(previous, next);
  }

  function dropLessonBefore(event: DragEvent<HTMLElement>, targetId: string) {
    if (!allowDrop(event, "lesson") || !dragged || dragged.kind !== "lesson") return;
    event.stopPropagation();
    const previous = structure;
    const next = moveLessonBefore(previous, dragged.id, targetId);
    setDragged(null);
    if (next) void persist(previous, next);
  }

  function dropLessonEnd(event: DragEvent<HTMLElement>, folderId: string | null) {
    if (!allowDrop(event, "lesson") || !dragged || dragged.kind !== "lesson") return;
    event.stopPropagation();
    const previous = structure;
    const next = moveLessonToEnd(previous, dragged.id, folderId);
    setDragged(null);
    if (next) void persist(previous, next);
  }

  const statusText =
    saveState === "saving"
      ? "Menyimpan urutan..."
      : saveState === "saved"
        ? "✓ Urutan tersimpan"
        : saveState === "error"
          ? `⚠ ${message || "Urutan gagal disimpan"}`
          : "Tersimpan otomatis setelah dilepas";

  const renderLesson = (item: ExplorerLessonContent) => (
    <div
      key={item.lesson.id}
      onDragOver={(event) => allowDrop(event, "lesson")}
      onDrop={(event) => dropLessonBefore(event, item.lesson.id)}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
    >
      <Handle
        label={`Seret lesson ${item.lesson.title}`}
        disabled={isSaving}
        onDragStart={(event) => startDrag(event, { kind: "lesson", id: item.lesson.id })}
        onDragEnd={() => setDragged(null)}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-900">{item.lesson.title}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
          Urutan {item.lesson.lesson_order} · {item.lesson.publication_status === "published" ? "Published" : "Draft"}
        </p>
      </div>
    </div>
  );

  return (
    <section className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm shadow-blue-950/5">
      <div className="flex flex-col gap-3 border-b border-blue-100 bg-blue-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-black text-slate-950 sm:text-lg">Atur Urutan Folder & Lesson</h2>
            <span className="rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">Drag & Drop</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Seret ikon ⋮⋮ untuk mengurutkan folder, mengurutkan lesson, atau memindahkan lesson ke folder lain.
          </p>
        </div>
        <p className={`text-xs font-black ${saveState === "error" ? "text-red-600" : saveState === "saved" ? "text-emerald-700" : "text-slate-500"}`}>
          {statusText}
        </p>
      </div>

      <div className="space-y-3 p-3 sm:p-5">
        {structure.folders.map(({ folder, lessons }) => (
          <div
            key={folder.id}
            onDragOver={(event) => allowDrop(event, "folder")}
            onDrop={(event) => dropFolder(event, folder.id)}
            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4"
          >
            <div className="flex items-center gap-3">
              <Handle
                label={`Seret folder ${folder.title}`}
                disabled={isSaving}
                onDragStart={(event) => startDrag(event, { kind: "folder", id: folder.id })}
                onDragEnd={() => setDragged(null)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-slate-950 sm:text-base">{folder.title}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Folder {folder.folder_order} · {lessons.length} lesson</p>
              </div>
            </div>

            <div className="mt-3 space-y-2 pl-4 sm:pl-12">
              {lessons.map(renderLesson)}
              <div
                onDragOver={(event) => allowDrop(event, "lesson")}
                onDrop={(event) => dropLessonEnd(event, folder.id)}
                className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-2 text-center text-[11px] font-bold text-slate-400"
              >
                {lessons.length ? "Lepaskan di sini untuk urutan terakhir folder" : "Tarik lesson ke folder ini"}
              </div>
            </div>
          </div>
        ))}

        <div
          onDragOver={(event) => allowDrop(event, "folder")}
          onDrop={(event) => dropFolder(event, null)}
          className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-center text-[11px] font-bold text-slate-400"
        >
          Lepaskan folder di sini untuk memindahkannya ke urutan terakhir
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
          <p className="text-sm font-black text-slate-900">Materi Lainnya</p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-500">Lesson tanpa folder · {structure.ungroupedLessons.length} lesson</p>
          <div className="mt-3 space-y-2">
            {structure.ungroupedLessons.map(renderLesson)}
            <div
              onDragOver={(event) => allowDrop(event, "lesson")}
              onDrop={(event) => dropLessonEnd(event, null)}
              className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-center text-[11px] font-bold text-slate-400"
            >
              {structure.ungroupedLessons.length ? "Lepaskan di sini untuk urutan terakhir tanpa folder" : "Tarik lesson ke sini untuk melepasnya dari folder"}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
