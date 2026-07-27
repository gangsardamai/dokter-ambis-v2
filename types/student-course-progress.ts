export interface FolderProgressItem {
  folderId: string | null;
  title: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number | null;
}

export interface QuizScorePoint {
  quizId: string;
  lessonId: string;
  quizTitle: string;
  lessonTitle: string;
  score: number;
  passingScore: number;
  assessmentType: "quiz" | "try_out";
  attemptedAt: string | null;
  quizOrder: number;
}

export interface WeakTopicItem {
  quizId: string;
  lessonId: string;
  quizTitle: string;
  lessonTitle: string;
  bestScore: number;
  passingScore: number;
}

export interface StudentCourseProgressSummary {
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  completedLessonIds: string[];
  folderProgress: FolderProgressItem[];
  scoreHistory: QuizScorePoint[];
  weakTopics: WeakTopicItem[];
}
