import { notFound } from "next/navigation";

import {
  LessonForm,
} from "@/components/admin/explorer";

import {
  lessonService,
} from "@/services";

import {
  updateLessonFormAction,
} from "./actions";

interface PageProps {
  params: Promise<{
    id: string;
    lessonId: string;
  }>;
}

export default async function EditLessonPage({
  params,
}: PageProps) {

  const {
    lessonId,
  } = await params;

  const lesson =
    await lessonService.getLessonById(
      lessonId,
    );

  if (!lesson) {
    notFound();
  }

  if (!lesson.folder_id) {
    notFound();
  }

  const action =
    updateLessonFormAction.bind(
      null,
      lessonId,
    );

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Edit Lesson
        </h1>

        <p className="mt-2 text-gray-500">
          Perbarui informasi lesson.
        </p>

      </div>

      <LessonForm
        defaultValues={{
          course_id: lesson.course_id,
          folder_id: lesson.folder_id,
          title: lesson.title,
          slug: lesson.slug,
          description:
            lesson.description ?? "",
          lesson_order:
            lesson.lesson_order,
          duration:
            lesson.duration,
          is_free:
            lesson.is_free,
        }}
        submitLabel="Update Lesson"
        action={action}
      />

    </div>

  );

}