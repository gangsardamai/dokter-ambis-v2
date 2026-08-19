import {
  folderRepository,
  lessonRepository,
} from "@/repositories";

import { folderService } from "./folder.service";
import { lessonFileService } from "./file.service";
import { lessonService } from "./lesson.service";
import { quizService } from "./quiz.service";
import { videoService } from "./video.service";

import type {
  CourseExplorerContent,
  ExplorerFile,
  ExplorerLesson,
  ExplorerLessonContent,
  ExplorerQuiz,
  ExplorerVideo,
} from "@/types/course-explorer";

export interface CourseStructureLessonGroup {
  folderId: string | null;
  lessonIds: string[];
}

export interface CourseStructureOrder {
  folderIds: string[];
  lessonGroups: CourseStructureLessonGroup[];
}

const UNGROUPED_KEY = "__ungrouped__";

function groupByLesson<T extends { lesson_id: string }>(
  items: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const item of items) {
    const current = grouped.get(item.lesson_id) ?? [];
    current.push(item);
    grouped.set(item.lesson_id, current);
  }

  return grouped;
}

function assertExactIds(
  label: string,
  submittedIds: string[],
  currentIds: string[],
): void {
  const submittedSet = new Set(submittedIds);
  const currentSet = new Set(currentIds);

  if (
    submittedIds.length !== submittedSet.size ||
    submittedIds.length !== currentIds.length ||
    currentIds.some((id) => !submittedSet.has(id)) ||
    submittedIds.some((id) => !currentSet.has(id))
  ) {
    throw new Error(
      `Susunan ${label} sudah berubah. Muat ulang halaman lalu coba lagi.`,
    );
  }
}

function sameOrder(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((id, index) => id === right[index])
  );
}

export class CourseExplorerService {
  async getCourseContent(
    courseId: string,
  ): Promise<CourseExplorerContent> {
    const [
      folders,
      lessons,
      files,
      videos,
      quizzes,
    ] = await Promise.all([
      folderService.getFoldersByCourse(courseId),
      lessonService.getLessonsByCourse(courseId),
      lessonFileService.getFilesByCourse(courseId),
      videoService.getVideosByCourse(courseId),
      quizService.getQuizzesByCourse(courseId),
    ]);

    const filesByLesson =
      groupByLesson<ExplorerFile>(files);
    const videosByLesson =
      groupByLesson<ExplorerVideo>(videos);
    const quizzesByLesson =
      groupByLesson<ExplorerQuiz>(quizzes);

    const contentByLesson = new Map<
      string,
      ExplorerLessonContent
    >();

    for (const lesson of lessons as ExplorerLesson[]) {
      contentByLesson.set(lesson.id, {
        lesson,
        files: filesByLesson.get(lesson.id) ?? [],
        videos: videosByLesson.get(lesson.id) ?? [],
        quizzes: quizzesByLesson.get(lesson.id) ?? [],
      });
    }

    return {
      folders: folders.map((folder) => ({
        folder,
        lessons: lessons
          .filter((lesson) => lesson.folder_id === folder.id)
          .map((lesson) => contentByLesson.get(lesson.id))
          .filter(
            (
              content,
            ): content is ExplorerLessonContent =>
              Boolean(content),
          ),
      })),
      ungroupedLessons: lessons
        .filter((lesson) => lesson.folder_id === null)
        .map((lesson) => contentByLesson.get(lesson.id))
        .filter(
          (
            content,
          ): content is ExplorerLessonContent =>
            Boolean(content),
        ),
    };
  }

  async saveCourseStructureOrder(
    courseId: string,
    order: CourseStructureOrder,
  ): Promise<void> {
    const [currentFolders, currentLessons] = await Promise.all([
      folderRepository.getByCourse(courseId),
      lessonRepository.getByCourse(courseId),
    ]);

    const currentFolderIds = currentFolders.map((folder) => folder.id);

    assertExactIds(
      "folder",
      order.folderIds,
      currentFolderIds,
    );

    const allowedFolderIds = new Set(currentFolderIds);
    const submittedGroupKeys = new Set<string>();
    const submittedGroupsByKey = new Map<
      string,
      CourseStructureLessonGroup
    >();
    const submittedLessonIds: string[] = [];

    for (const group of order.lessonGroups) {
      const groupKey = group.folderId ?? UNGROUPED_KEY;

      if (submittedGroupKeys.has(groupKey)) {
        throw new Error(
          "Susunan lesson tidak valid karena folder tercatat lebih dari satu kali.",
        );
      }

      if (
        group.folderId !== null &&
        !allowedFolderIds.has(group.folderId)
      ) {
        throw new Error(
          "Folder tujuan lesson tidak termasuk dalam course ini.",
        );
      }

      submittedGroupKeys.add(groupKey);
      submittedGroupsByKey.set(groupKey, group);
      submittedLessonIds.push(...group.lessonIds);
    }

    const expectedGroupKeys = new Set<string>([
      UNGROUPED_KEY,
      ...currentFolderIds,
    ]);

    if (
      submittedGroupKeys.size !== expectedGroupKeys.size ||
      [...expectedGroupKeys].some(
        (key) => !submittedGroupKeys.has(key),
      )
    ) {
      throw new Error(
        "Susunan lesson tidak lengkap. Muat ulang halaman lalu coba lagi.",
      );
    }

    assertExactIds(
      "lesson",
      submittedLessonIds,
      currentLessons.map((lesson) => lesson.id),
    );

    const currentGroupsByKey = new Map<string, string[]>();
    currentGroupsByKey.set(UNGROUPED_KEY, []);

    for (const folderId of currentFolderIds) {
      currentGroupsByKey.set(folderId, []);
    }

    for (const lesson of currentLessons) {
      const groupKey = lesson.folder_id ?? UNGROUPED_KEY;
      const currentGroup = currentGroupsByKey.get(groupKey);

      if (!currentGroup) {
        throw new Error(
          "Terdapat lesson yang terhubung ke folder di luar course ini.",
        );
      }

      currentGroup.push(lesson.id);
    }

    const folderOrderChanged = !sameOrder(
      order.folderIds,
      currentFolderIds,
    );

    const lessonStructureChanged = [...expectedGroupKeys].some((key) => {
      const submittedGroup = submittedGroupsByKey.get(key);
      const currentGroup = currentGroupsByKey.get(key);

      if (!submittedGroup || !currentGroup) return true;

      return !sameOrder(submittedGroup.lessonIds, currentGroup);
    });

    // Folder drag only touches folder_order. Lesson rows are intentionally
    // left untouched so moving a folder cannot silently reindex lessons.
    if (folderOrderChanged && order.folderIds.length > 0) {
      const maxCurrentOrder = Math.max(
        0,
        ...currentFolders.map((folder) => folder.folder_order),
      );
      const temporaryBase =
        maxCurrentOrder + order.folderIds.length + 1000;

      for (const [index, folderId] of order.folderIds.entries()) {
        await folderRepository.update(folderId, {
          folder_order: temporaryBase + index,
        });
      }

      for (const [index, folderId] of order.folderIds.entries()) {
        await folderRepository.update(folderId, {
          folder_order: index + 1,
        });
      }
    }

    // Lesson drag only touches lesson assignment/order. Folder ordering is
    // not rewritten when the folder sequence itself did not change.
    if (!lessonStructureChanged) return;

    const orderedLessonAssignments: Array<{
      lessonId: string;
      folderId: string | null;
    }> = [];

    for (const folderId of order.folderIds) {
      const group = submittedGroupsByKey.get(folderId);

      if (!group) {
        throw new Error(
          "Susunan lesson tidak lengkap. Muat ulang halaman lalu coba lagi.",
        );
      }

      for (const lessonId of group.lessonIds) {
        orderedLessonAssignments.push({
          lessonId,
          folderId,
        });
      }
    }

    const ungroupedGroup = submittedGroupsByKey.get(UNGROUPED_KEY);

    if (!ungroupedGroup) {
      throw new Error(
        "Susunan lesson tanpa folder tidak ditemukan. Muat ulang halaman lalu coba lagi.",
      );
    }

    for (const lessonId of ungroupedGroup.lessonIds) {
      orderedLessonAssignments.push({
        lessonId,
        folderId: null,
      });
    }

    if (orderedLessonAssignments.length === 0) return;

    const maxCurrentLessonOrder = Math.max(
      0,
      ...currentLessons.map((lesson) => lesson.lesson_order),
    );
    const temporaryLessonBase =
      maxCurrentLessonOrder + orderedLessonAssignments.length + 1000;

    for (const [index, assignment] of orderedLessonAssignments.entries()) {
      await lessonRepository.update(assignment.lessonId, {
        lesson_order: temporaryLessonBase + index,
      });
    }

    for (const [index, assignment] of orderedLessonAssignments.entries()) {
      await lessonRepository.update(assignment.lessonId, {
        folder_id: assignment.folderId,
        lesson_order: index + 1,
      });
    }
  }
}

export const courseExplorerService =
  new CourseExplorerService();
