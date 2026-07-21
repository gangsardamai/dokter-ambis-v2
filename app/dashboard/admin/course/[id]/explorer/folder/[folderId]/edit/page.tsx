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
    folderId,
  } = await params;

  const folder =
    await folderService.getFolderById(
      folderId,
    );

  if (!folder) {
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