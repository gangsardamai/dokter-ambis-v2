import { notFound } from "next/navigation";

import { FolderForm } from "@/components/admin/explorer";
import { courseService } from "@/services";

import { createMentorFolderAction } from "./actions";

export default async function MentorCreateFolderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await courseService.getCourseById(id);

  if (!course) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Course Explorer
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
          Tambah Folder
        </h1>
        <p className="mt-2 text-sm text-slate-500">{course.title}</p>
      </div>

      <FolderForm
        defaultValues={{
          course_id: course.id,
          folder_order: 1,
        }}
        submitLabel="Simpan Folder"
        action={createMentorFolderAction}
      />
    </main>
  );
}
