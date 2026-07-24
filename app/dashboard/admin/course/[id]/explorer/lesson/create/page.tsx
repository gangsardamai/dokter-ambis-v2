import { notFound } from "next/navigation";

import {
  LessonForm,
} from "@/components/admin/explorer";

import {
  courseService,
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

  if (!course) {
    notFound();
  }

  if (!folderId) {
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
          publication_status: "draft",
        }}

        submitLabel="Simpan Lesson"

        action={createLessonFormAction}

        showOrder={false}

      />

    </div>
  );
}