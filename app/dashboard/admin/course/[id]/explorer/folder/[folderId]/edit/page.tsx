import { notFound } from "next/navigation";

import {
  FolderForm,
} from "@/components/admin/explorer";

import {
  folderService,
} from "@/services";

import {
  updateFolderFormAction,
} from "./actions";

interface PageProps {
  params: Promise<{
    id: string;
    folderId: string;
  }>;
}

export default async function EditFolderPage({
  params,
}: PageProps) {

  const {
    id: courseId,
    folderId,
  } = await params;

  const folder =
    await folderService.getFolderById(
      folderId,
    );

  if (!folder || folder.course_id !== courseId) {
    notFound();
  }

  return (
    <FolderForm
      defaultValues={folder}
      submitLabel="Update Folder"
      action={updateFolderFormAction}
    />
  );

}