import { notFound } from "next/navigation";

import { lessonService } from "@/services";

import { deleteLessonAction } from "./actions";

interface PageProps {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
}

export default async function DeleteLessonPage({
  params,
}: PageProps) {

  const {
    id: courseId,
    lessonId,
  } = await params;

  const lesson =
    await lessonService.getLessonById(
      lessonId,
    );

  if (!lesson) {
    notFound();
  }

  return (

    <div className="mx-auto max-w-xl space-y-6">

      <div>

        <h1 className="text-3xl font-bold text-red-600">
          Hapus Lesson
        </h1>

        <p className="mt-2 text-gray-500">
          Tindakan ini tidak dapat dibatalkan.
        </p>

      </div>

      <div className="rounded-lg border p-6">

        <p className="text-lg">
          Apakah Anda yakin ingin menghapus lesson:
        </p>

        <p className="mt-3 font-semibold">
          {lesson.title}
        </p>

      </div>

      <form
        action={async () => {
          "use server";

          await deleteLessonAction(
            courseId,
            lessonId,
          );
        }}
      >

        <button
          type="submit"
          className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Ya, Hapus Lesson
        </button>

      </form>

    </div>

  );

}