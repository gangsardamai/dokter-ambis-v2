"use client";

import { useRouter } from "next/navigation";
import {
  type DragEvent as ReactDragEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  saveExplorerOrderAction,
  type ExplorerManagerRole,
} from "@/app/dashboard/explorer-order-actions";
import type {
  CourseExplorerContent,
  ExplorerLessonContent,
} from "@/types/course-explorer";

interface InlineCourseStructureDndProps {
  courseId: string;
  content: CourseExplorerContent;
  managerRole: ExplorerManagerRole;
  children: ReactNode;
}

type DraggedItem =
  | { kind: "folder"; id: string }
  | { kind: "lesson"; id: string }
  | null;

type SaveState = "idle" | "saving" | "saved" | "error";

const UNGROUPED_KEY = "__ungrouped__";

function normalize(content: CourseExplorerContent): CourseExplorerContent {
  return {
    folders: content.folders.map((group, folderIndex) => ({
      folder: {
        ...group.folder,
        folder_order: folderIndex + 1,
      },
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

  return {
    content: { folders, ungroupedLessons },
    lesson,
  };
}

function moveFolder(
  content: CourseExplorerContent,
  draggedId: string,
  targetId: string | null,
): CourseExplorerContent | null {
  if (targetId === draggedId) return null;

  const folders = [...content.folders];
  const from = folders.findIndex((group) => group.folder.id === draggedId);
  if (from < 0) return null;

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
): CourseExplorerContent | null {
  if (draggedId === targetId) return null;

  const detached = detachLesson(content, draggedId);
  if (!detached.lesson) return null;

  let inserted = false;

  const folders = detached.content.folders.map((group) => {
    const targetIndex = group.lessons.findIndex(
      (item) => item.lesson.id === targetId,
    );

    if (targetIndex < 0) return group;

    const lessons = [...group.lessons];
    lessons.splice(targetIndex, 0, detached.lesson!);
    inserted = true;

    return { ...group, lessons };
  });

  let ungroupedLessons = detached.content.ungroupedLessons;

  if (!inserted) {
    const targetIndex = ungroupedLessons.findIndex(
      (item) => item.lesson.id === targetId,
    );

    if (targetIndex >= 0) {
      ungroupedLessons = [...ungroupedLessons];
      ungroupedLessons.splice(targetIndex, 0, detached.lesson);
      inserted = true;
    }
  }

  return inserted
    ? normalize({ folders, ungroupedLessons })
    : null;
}

function moveLessonToEnd(
  content: CourseExplorerContent,
  draggedId: string,
  folderId: string | null,
): CourseExplorerContent | null {
  const detached = detachLesson(content, draggedId);
  if (!detached.lesson) return null;

  if (folderId === null) {
    return normalize({
      ...detached.content,
      ungroupedLessons: [
        ...detached.content.ungroupedLessons,
        detached.lesson,
      ],
    });
  }

  if (
    !detached.content.folders.some(
      (group) => group.folder.id === folderId,
    )
  ) {
    return null;
  }

  return normalize({
    ...detached.content,
    folders: detached.content.folders.map((group) =>
      group.folder.id === folderId
        ? {
            ...group,
            lessons: [...group.lessons, detached.lesson!],
          }
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
        lessonIds: content.ungroupedLessons.map(
          (item) => item.lesson.id,
        ),
      },
    ],
  };
}

function getDirectLessonContainer(parent: Element | null): HTMLElement | null {
  if (!parent) return null;

  for (const child of Array.from(parent.children)) {
    if (!(child instanceof HTMLElement)) continue;

    const hasLessonDetails = Array.from(child.children).some(
      (grandChild) =>
        grandChild instanceof HTMLDetailsElement &&
        grandChild.classList.contains("group"),
    );

    if (hasLessonDetails) return child;
  }

  return null;
}

function createLessonHandle(
  lessonId: string,
  lessonTitle: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.draggable = true;
  button.dataset.inlineDndCreated = "true";
  button.dataset.dndHandle = "lesson";
  button.dataset.dndId = lessonId;
  button.setAttribute("aria-label", `Seret lesson ${lessonTitle}`);
  button.title = `Seret lesson ${lessonTitle}`;
  button.className =
    "grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50";
  button.style.cursor = "grab";
  button.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8M8 10h8M8 16h8"/><circle cx="5" cy="4" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="5" cy="16" r="1" fill="currentColor" stroke="none"/></svg>';
  return button;
}

function createFolderHandle(
  folderId: string,
  folderTitle: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.draggable = true;
  button.dataset.inlineDndCreated = "true";
  button.dataset.dndHandle = "folder";
  button.dataset.dndId = folderId;
  button.setAttribute("aria-label", `Seret folder ${folderTitle}`);
  button.title = `Seret folder ${folderTitle}`;
  button.className =
    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-[#063d67] text-white shadow-sm transition ring-2 ring-transparent hover:ring-blue-200";
  button.style.cursor = "grab";
  button.innerHTML =
    '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  return button;
}

function setLessonHandle(
  lessonElement: HTMLDetailsElement,
  lessonId: string,
  lessonTitle: string,
) {
  lessonElement.dataset.dndLessonId = lessonId;

  const summary = lessonElement.querySelector(":scope > summary");
  if (!(summary instanceof HTMLElement)) return;

  let handle = summary.querySelector<HTMLElement>(
    '[data-dnd-handle="lesson"]',
  );

  if (!handle) {
    handle = createLessonHandle(lessonId, lessonTitle);
    summary.insertBefore(handle, summary.firstChild);

    const titleArea = handle.nextElementSibling;
    if (titleArea instanceof HTMLElement) {
      titleArea.style.flex = "1 1 auto";
    }
  }

  handle.draggable = true;
  handle.dataset.dndId = lessonId;
  handle.title = `Seret lesson ${lessonTitle}`;
  handle.setAttribute("aria-label", `Seret lesson ${lessonTitle}`);
}

export default function InlineCourseStructureDnd({
  courseId,
  content,
  managerRole,
  children,
}: InlineCourseStructureDndProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<CourseExplorerContent>(normalize(content));
  const draggedRef = useRef<DraggedItem>(null);
  const sourceElementRef = useRef<HTMLElement | null>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);
  const savingRef = useRef(false);
  const [dragKind, setDragKind] = useState<"folder" | "lesson" | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!savingRef.current) {
      structureRef.current = normalize(content);
    }
  }, [content]);

  const persist = useCallback(
    async (
      previous: CourseExplorerContent,
      next: CourseExplorerContent,
    ) => {
      structureRef.current = next;
      savingRef.current = true;
      setSaveState("saving");
      setMessage("");

      try {
        const payload = buildPayload(next);
        const result = await saveExplorerOrderAction({
          managerRole,
          courseId,
          folderIds: payload.folderIds,
          lessonGroups: payload.lessonGroups,
        });

        if (!result.success) {
          structureRef.current = previous;
          setSaveState("error");
          setMessage(result.message);
          router.refresh();
          return;
        }

        setSaveState("saved");
        setMessage(result.message);
        router.refresh();

        window.setTimeout(() => {
          setSaveState("idle");
          setMessage("");
        }, 1800);
      } catch (error) {
        structureRef.current = previous;
        setSaveState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Urutan gagal disimpan.",
        );
        router.refresh();
      } finally {
        savingRef.current = false;
      }
    },
    [courseId, managerRole, router],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const listRoot = root.firstElementChild;
    if (!(listRoot instanceof HTMLElement)) return;

    const folderElements = Array.from(listRoot.children).filter(
      (child): child is HTMLDetailsElement =>
        child instanceof HTMLDetailsElement,
    );

    for (const [folderIndex, group] of content.folders.entries()) {
      const folderElement = folderElements[folderIndex];
      if (!folderElement) continue;

      folderElement.dataset.dndFolderId = group.folder.id;
      folderElement.dataset.dndLessonZone = group.folder.id;

      const summary = folderElement.querySelector(":scope > summary");
      if (!(summary instanceof HTMLElement)) continue;

      let folderHandle = summary.querySelector<HTMLElement>(
        '[data-dnd-handle="folder"]',
      );

      if (!folderHandle) {
        const existingIcon = summary.querySelector<SVGElement>(
          ":scope > div span > svg",
        )?.parentElement;

        if (existingIcon instanceof HTMLElement) {
          folderHandle = existingIcon;
          folderHandle.dataset.dndHandle = "folder";
          folderHandle.setAttribute("role", "button");
          folderHandle.tabIndex = 0;
          folderHandle.style.cursor = "grab";
        } else {
          folderHandle = createFolderHandle(
            group.folder.id,
            group.folder.title,
          );
          summary.insertBefore(folderHandle, summary.firstChild);

          const titleArea = folderHandle.nextElementSibling;
          if (titleArea instanceof HTMLElement) {
            titleArea.style.flex = "1 1 auto";
          }
        }
      }

      folderHandle.draggable = true;
      folderHandle.dataset.dndId = group.folder.id;
      folderHandle.title = `Seret folder ${group.folder.title}`;
      folderHandle.setAttribute(
        "aria-label",
        `Seret folder ${group.folder.title}`,
      );

      const folderBody = folderElement.querySelector(":scope > div");
      const lessonContainer = getDirectLessonContainer(folderBody);
      const lessonElements = lessonContainer
        ? Array.from(lessonContainer.children).filter(
            (child): child is HTMLDetailsElement =>
              child instanceof HTMLDetailsElement &&
              child.classList.contains("group"),
          )
        : [];

      for (const [lessonIndex, lessonContent] of group.lessons.entries()) {
        const lessonElement = lessonElements[lessonIndex];
        if (!lessonElement) continue;

        setLessonHandle(
          lessonElement,
          lessonContent.lesson.id,
          lessonContent.lesson.title,
        );
      }
    }

    const ungroupedSection = Array.from(listRoot.children).find(
      (child) => child instanceof HTMLElement && child.tagName === "SECTION",
    );

    if (ungroupedSection instanceof HTMLElement) {
      ungroupedSection.dataset.dndLessonZone = UNGROUPED_KEY;
      const lessonContainer = getDirectLessonContainer(ungroupedSection);
      const lessonElements = lessonContainer
        ? Array.from(lessonContainer.children).filter(
            (child): child is HTMLDetailsElement =>
              child instanceof HTMLDetailsElement &&
              child.classList.contains("group"),
          )
        : [];

      for (const [lessonIndex, lessonContent] of content.ungroupedLessons.entries()) {
        const lessonElement = lessonElements[lessonIndex];
        if (!lessonElement) continue;

        setLessonHandle(
          lessonElement,
          lessonContent.lesson.id,
          lessonContent.lesson.title,
        );
      }
    }

    function clearHighlight() {
      if (!highlightedRef.current) return;

      highlightedRef.current.style.outline = "";
      highlightedRef.current.style.outlineOffset = "";
      highlightedRef.current.style.borderTopColor = "";
      highlightedRef.current.style.borderTopWidth = "";
      highlightedRef.current = null;
    }

    function highlight(element: HTMLElement, type: "before" | "zone") {
      if (highlightedRef.current === element) return;

      clearHighlight();
      highlightedRef.current = element;

      if (type === "before") {
        element.style.borderTopWidth = "3px";
        element.style.borderTopColor = "rgb(37 99 235)";
      } else {
        element.style.outline = "2px solid rgb(37 99 235)";
        element.style.outlineOffset = "2px";
      }
    }

    function resetDrag() {
      clearHighlight();

      if (sourceElementRef.current) {
        sourceElementRef.current.style.opacity = "";
      }

      sourceElementRef.current = null;
      draggedRef.current = null;
      setDragKind(null);
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (target.closest("[data-dnd-handle]")) {
        event.preventDefault();
        event.stopPropagation();
      }
    }

    function handleDragStart(event: DragEvent) {
      if (savingRef.current) {
        event.preventDefault();
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const handle = target.closest<HTMLElement>("[data-dnd-handle]");
      if (!handle) return;

      const kind = handle.dataset.dndHandle;
      const id = handle.dataset.dndId;

      if ((kind !== "folder" && kind !== "lesson") || !id) return;

      draggedRef.current = { kind, id };
      setDragKind(kind);

      const source =
        kind === "folder"
          ? handle.closest<HTMLElement>("[data-dnd-folder-id]")
          : handle.closest<HTMLElement>("[data-dnd-lesson-id]");

      sourceElementRef.current = source;
      if (source) source.style.opacity = "0.55";

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", `${kind}:${id}`);
      }
    }

    function handleDragOver(event: DragEvent) {
      const dragged = draggedRef.current;
      if (!dragged || savingRef.current) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      if (dragged.kind === "folder") {
        const folderTarget = target.closest<HTMLElement>("[data-dnd-folder-id]");

        if (
          folderTarget?.dataset.dndFolderId === dragged.id
        ) {
          clearHighlight();
          return;
        }

        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";

        if (folderTarget) {
          highlight(folderTarget, "before");
        } else {
          clearHighlight();
        }

        return;
      }

      const lessonTarget = target.closest<HTMLElement>("[data-dnd-lesson-id]");

      if (lessonTarget) {
        if (lessonTarget.dataset.dndLessonId === dragged.id) {
          clearHighlight();
          return;
        }

        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
        highlight(lessonTarget, "before");
        return;
      }

      const zone = target.closest<HTMLElement>("[data-dnd-lesson-zone]");
      if (!zone) return;

      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      highlight(zone, "zone");
    }

    function handleDrop(event: DragEvent) {
      const dragged = draggedRef.current;
      if (!dragged || savingRef.current) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const previous = structureRef.current;
      let next: CourseExplorerContent | null = null;

      if (dragged.kind === "folder") {
        const folderTarget = target.closest<HTMLElement>("[data-dnd-folder-id]");
        const targetId = folderTarget?.dataset.dndFolderId ?? null;

        if (targetId === dragged.id) {
          resetDrag();
          return;
        }

        next = moveFolder(previous, dragged.id, targetId);
      } else {
        const lessonTarget = target.closest<HTMLElement>("[data-dnd-lesson-id]");

        if (lessonTarget?.dataset.dndLessonId) {
          if (lessonTarget.dataset.dndLessonId === dragged.id) {
            resetDrag();
            return;
          }

          next = moveLessonBefore(
            previous,
            dragged.id,
            lessonTarget.dataset.dndLessonId,
          );
        } else {
          const zone = target.closest<HTMLElement>("[data-dnd-lesson-zone]");
          const zoneValue = zone?.dataset.dndLessonZone;

          if (zoneValue) {
            next = moveLessonToEnd(
              previous,
              dragged.id,
              zoneValue === UNGROUPED_KEY ? null : zoneValue,
            );
          }
        }
      }

      if (!next) {
        resetDrag();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      resetDrag();
      void persist(previous, next);
    }

    function handleDragEnd() {
      resetDrag();
    }

    root.addEventListener("click", handleClick, true);
    root.addEventListener("dragstart", handleDragStart);
    root.addEventListener("dragover", handleDragOver);
    root.addEventListener("drop", handleDrop);
    root.addEventListener("dragend", handleDragEnd);

    return () => {
      root.removeEventListener("click", handleClick, true);
      root.removeEventListener("dragstart", handleDragStart);
      root.removeEventListener("dragover", handleDragOver);
      root.removeEventListener("drop", handleDrop);
      root.removeEventListener("dragend", handleDragEnd);
      clearHighlight();
    };
  }, [content, persist]);

  function handleUngroupedDragOver(
    event: ReactDragEvent<HTMLDivElement>,
  ) {
    if (
      dragKind !== "lesson" ||
      savingRef.current ||
      draggedRef.current?.kind !== "lesson"
    ) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleUngroupedDrop(
    event: ReactDragEvent<HTMLDivElement>,
  ) {
    const dragged = draggedRef.current;

    if (
      dragKind !== "lesson" ||
      savingRef.current ||
      !dragged ||
      dragged.kind !== "lesson"
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const previous = structureRef.current;
    const next = moveLessonToEnd(previous, dragged.id, null);

    if (sourceElementRef.current) {
      sourceElementRef.current.style.opacity = "";
    }

    sourceElementRef.current = null;
    draggedRef.current = null;
    setDragKind(null);

    if (next) void persist(previous, next);
  }

  const statusText =
    saveState === "saving"
      ? "Menyimpan urutan..."
      : saveState === "saved"
        ? "✓ Urutan tersimpan"
        : saveState === "error"
          ? `⚠ ${message || "Urutan gagal disimpan"}`
          : "Seret icon folder atau lesson untuk mengubah urutan";

  return (
    <div className="space-y-3">
      <div className="flex min-h-6 justify-end px-1">
        <p
          role={saveState === "error" ? "alert" : "status"}
          className={`text-xs font-semibold ${
            saveState === "error"
              ? "text-red-600"
              : saveState === "saved"
                ? "text-emerald-700"
                : "text-slate-500"
          }`}
        >
          {statusText}
        </p>
      </div>

      <div ref={rootRef}>{children}</div>

      {dragKind === "lesson" && (
        <div
          data-dnd-lesson-zone={UNGROUPED_KEY}
          onDragOver={handleUngroupedDragOver}
          onDrop={handleUngroupedDrop}
          className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/70 px-4 py-3 text-center text-sm font-bold text-blue-700"
        >
          Lepas di sini untuk memindahkan lesson ke Materi Lainnya
        </div>
      )}
    </div>
  );
}
