import { studentCourseProgressRepository } from "@/repositories";

import type {
  FolderProgressItem,
  QuizScorePoint,
  StudentCourseProgressSummary,
  WeakTopicItem,
} from "@/types/student-course-progress";

function calculatePercentage(completed: number, total: number): number {
  if (total <= 0) return 0;

  return Math.round((completed / total) * 100);
}

function isTryOutTitle(title: string): boolean {
  const normalized = title.toLowerCase();

  return (
    normalized.includes("try out") ||
    normalized.includes("tryout") ||
    normalized.includes("try-out")
  );
}

export class StudentCourseProgressService {
  async getCourseProgress(
    profileId: string,
    courseId: string,
  ): Promise<StudentCourseProgressSummary> {
    const data =
      await studentCourseProgressRepository.getCourseProgressData(
        profileId,
        courseId,
      );

    const completedLessonIds = new Set(
      data.lessonProgress
        .filter((progress) => progress.is_completed)
        .map((progress) => progress.lesson_id),
    );

    const requiredLessons = data.lessons.filter(
      (lesson) => lesson.is_required,
    );
    const completedRequiredLessons = requiredLessons.filter((lesson) =>
      completedLessonIds.has(lesson.id),
    ).length;

    const folderProgress: FolderProgressItem[] = data.folders.map(
      (folder) => {
        const lessons = requiredLessons.filter(
          (lesson) => lesson.folder_id === folder.id,
        );
        const completedLessons = lessons.filter((lesson) =>
          completedLessonIds.has(lesson.id),
        ).length;

        return {
          folderId: folder.id,
          title: folder.title,
          completedLessons,
          totalLessons: lessons.length,
          percentage:
            lessons.length === 0
              ? null
              : calculatePercentage(completedLessons, lessons.length),
        };
      },
    );

    const ungroupedLessons = requiredLessons.filter(
      (lesson) => lesson.folder_id === null,
    );

    if (ungroupedLessons.length > 0) {
      const completedLessons = ungroupedLessons.filter((lesson) =>
        completedLessonIds.has(lesson.id),
      ).length;

      folderProgress.push({
        folderId: null,
        title: "Materi Lainnya",
        completedLessons,
        totalLessons: ungroupedLessons.length,
        percentage: calculatePercentage(
          completedLessons,
          ungroupedLessons.length,
        ),
      });
    }

    const lessonsById = new Map(
      data.lessons.map((lesson) => [lesson.id, lesson]),
    );
    const resultsByQuizId = new Map(
      data.quizResults.map((result) => [result.quiz_id, result]),
    );

    const scoreHistory: QuizScorePoint[] = data.quizzes
      .map((quiz) => {
        const result = resultsByQuizId.get(quiz.id);
        const lesson = lessonsById.get(quiz.lesson_id);

        if (
          !result ||
          result.attempts_used <= 0 ||
          result.best_score === null ||
          !lesson
        ) {
          return null;
        }

        return {
          quizId: quiz.id,
          lessonId: quiz.lesson_id,
          quizTitle: quiz.title,
          lessonTitle: lesson.title,
          score: Number(result.best_score),
          passingScore: quiz.passing_score,
          assessmentType: isTryOutTitle(quiz.title)
            ? ("try_out" as const)
            : ("quiz" as const),
          attemptedAt: result.last_attempt_at,
          quizOrder: quiz.quiz_order,
        };
      })
      .filter((item): item is QuizScorePoint => item !== null)
      .sort((left, right) => {
        if (left.attemptedAt && right.attemptedAt) {
          return (
            new Date(left.attemptedAt).getTime() -
            new Date(right.attemptedAt).getTime()
          );
        }

        return left.quizOrder - right.quizOrder;
      });

    const weakTopics: WeakTopicItem[] = scoreHistory
      .filter((item) => item.score < item.passingScore)
      .sort((left, right) => left.score - right.score)
      .map((item) => ({
        quizId: item.quizId,
        lessonId: item.lessonId,
        quizTitle: item.quizTitle,
        lessonTitle: item.lessonTitle,
        bestScore: item.score,
        passingScore: item.passingScore,
      }));

    const completedQuizzes = data.quizzes.filter((quiz) => {
      const result = resultsByQuizId.get(quiz.id);
      return Boolean(result && result.attempts_used > 0);
    }).length;

    return {
      progressPercentage: calculatePercentage(
        completedRequiredLessons,
        requiredLessons.length,
      ),
      completedLessons: completedRequiredLessons,
      totalLessons: requiredLessons.length,
      completedQuizzes,
      totalQuizzes: data.quizzes.length,
      completedLessonIds: Array.from(completedLessonIds),
      folderProgress,
      scoreHistory,
      weakTopics,
    };
  }

  async toggleLessonCompletion(
    profileId: string,
    courseId: string,
    lessonId: string,
  ): Promise<boolean> {
    const lesson =
      await studentCourseProgressRepository.getLessonForCompletion(
        lessonId,
      );

    if (
      !lesson ||
      lesson.course_id !== courseId ||
      lesson.publication_status !== "published"
    ) {
      throw new Error("Lesson tidak tersedia pada course ini.");
    }

    const current =
      await studentCourseProgressRepository.getLessonCompletion(
        profileId,
        lessonId,
      );

    return await studentCourseProgressRepository.setLessonCompletion(
      profileId,
      lessonId,
      !current?.is_completed,
    );
  }
}

export const studentCourseProgressService =
  new StudentCourseProgressService();
