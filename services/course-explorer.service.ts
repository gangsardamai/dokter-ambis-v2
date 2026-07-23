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
}

export const courseExplorerService =
  new CourseExplorerService();
