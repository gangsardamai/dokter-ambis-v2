import { notFound } from "next/navigation";

import { LessonForm } from "@/components/admin/explorer";
import { courseService } from "@/services";

import { createMentorLessonAction } from "./actions";

export default async function MentorCreateLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ folderId?: string }>;
}) {
  const { id } = await params;
  const { folderId } = await searchParams;
  const course = await courseService.getCourseById(id);

  if (!course || !folderId) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Course Explorer
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
          Tambah Lesson
        </h1>
        <p className="mt-2 text-sm text-slate-500">{course.title}</p>
      </div>

      <LessonForm
        defaultValues={{
          course_id: course.id,
          folder_id: folderId,
          duration: 10,
          is_free: false,
          is_required: true,
          publication_status: "draft",
        }}
        submitLabel="Simpan Lesson"
        action={createMentorLessonAction}
        showOrder={false}
      />
    </main>
  );
}