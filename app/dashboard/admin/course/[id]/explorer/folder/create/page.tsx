import { notFound } from "next/navigation";

import {
  FolderForm,
} from "@/components/admin/explorer";

import {
  courseService,
} from "@/services";

import {
  createFolderFormAction,
} from "./actions";

export default async function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const course =
    await courseService.getCourseById(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Tambah Folder
        </h1>

        <p className="mt-2 text-gray-500">
          {course.title}
        </p>

      </div>
<FolderForm
  defaultValues={{
    course_id: course.id,
    folder_order: 1,
  }}
  submitLabel="Simpan Folder"
  action={createFolderFormAction}
/>

    </div>
  );
}