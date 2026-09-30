import { notFound } from "next/navigation";

import {
  LessonForm,
} from "@/components/admin/explorer";

import {
  courseService,
  folderService,
} from "@/services";

import {
  createLessonFormAction,
} from "./actions";

interface PageProps {
  searchParams: Promise<{
    folderId?: string;
  }>;

  params: Promise<{
    id: string;
  }>;
}

export default async function Page({
  params,
  searchParams,
}: PageProps) {

  const { id } = await params;

  const { folderId } =
    await searchParams;

  const course =
    await courseService.getCourseById(id);

  if (!course || !folderId) {
    notFound();
  }

  const folder =
    await folderService.getFolderById(folderId);

  if (!folder || folder.course_id !== course.id) {
    notFound();
  }

  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Tambah Lesson
        </h1>

        <p className="mt-2 text-gray-500">
          {course.title}
        </p>

      </div>

      <LessonForm

        defaultValues={{
          course_id: course.id,
          folder_id: folderId,
          duration: 10,
          is_free: false,
          is_required: true,
          publication_status: "published",
        }}

        submitLabel="Simpan Lesson"

        action={createLessonFormAction}

        showOrder={false}

      />

    </div>
  );
}