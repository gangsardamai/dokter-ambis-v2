import { notFound } from "next/navigation";

import {
  lessonService,
  videoService,
  lessonFileService,
  liveClassService,
  quizService,
} from "@/services";

import LessonHeader from "@/components/materi/LessonHeader";
import VideoSection from "@/components/materi/VideoSection";
import FileSection from "@/components/materi/FileSection";
import LiveClassSection from "@/components/materi/LiveClassSection";
import QuizSection from "@/components/materi/QuizSection";

interface Props {
  params: Promise<{
    lessonSlug: string;
  }>;
}

export default async function MateriDetailPage({
  params,
}: Props) {

  const { lessonSlug } = await params;

  // ==========================
  // Lesson
  // ==========================

  const lesson =
    await lessonService.getLessonDetail(
      lessonSlug
    );

  if (!lesson) {
    notFound();
  }

  // ==========================
  // Video
  // ==========================

  const videos =
    await videoService.getVideosByLesson(
      lesson.id
    );

  // ==========================
  // Files
  // ==========================

  const files =
    await lessonFileService.getFilesByLesson(
      lesson.id
    );

  // ==========================
  // Live Class
  // ==========================

  const liveClasses =
    await liveClassService.getLiveClassesByLesson(
      lesson.id
    );

  // ==========================
  // Quiz
  // ==========================

  const quizzes =
    await quizService.getQuizzesByLesson(
      lesson.id
    );

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      <LessonHeader
        title={lesson.title}
        description={
          lesson.description ?? undefined
        }
      />

      <div className="flex flex-wrap gap-6 mb-10 text-sm text-gray-500">

        <span>
          ⏱ {lesson.duration ?? "-"} menit
        </span>

        {lesson.is_free && (
          <span className="font-semibold text-green-600">
            Gratis
          </span>
        )}

      </div>

      <VideoSection
        videos={videos}
      />

      <FileSection
        files={files}
      />

      <LiveClassSection
        liveClasses={liveClasses}
      />

      <QuizSection
        quizzes={quizzes}
      />

    </main>
  );
}