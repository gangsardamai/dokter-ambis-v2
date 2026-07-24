import { notFound } from "next/navigation";

import { LessonForm } from "@/components/admin/explorer";
import { lessonService } from "@/services";

import { updateMentorLessonAction } from "./actions";

export default async function MentorEditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: courseId, lessonId } = await params;
  const lesson = await lessonService.getLessonById(lessonId);

  if (!lesson || lesson.course_id !== courseId) {
    notFound();
  }

  const action = updateMentorLessonAction.bind(
    null,
    courseId,
    lessonId,
  );

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Course Explorer
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
          Edit Lesson
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Perbarui informasi lesson yang ditugaskan kepada Anda.
        </p>
      </div>

      <LessonForm
        defaultValues={{
          course_id: lesson.course_id,
          folder_id: lesson.folder_id,
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description ?? "",
          lesson_order: lesson.lesson_order,
          duration: lesson.duration,
          is_free: lesson.is_free,
          is_required: lesson.is_required,
          publication_status: lesson.publication_status,
        }}
        submitLabel="Update Lesson"
        action={action}
      />
    </main>
  );
}
