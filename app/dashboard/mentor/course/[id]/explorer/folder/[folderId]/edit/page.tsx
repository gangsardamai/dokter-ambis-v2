import { notFound } from "next/navigation";

import { FolderForm } from "@/components/admin/explorer";
import { folderService } from "@/services";

import { updateMentorFolderAction } from "./actions";

export default async function MentorEditFolderPage({
  params,
}: {
  params: Promise<{ id: string; folderId: string }>;
}) {
  const { folderId } = await params;
  const folder = await folderService.getFolderById(folderId);

  if (!folder) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
          Course Explorer
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950">
          Edit Folder
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Perbarui struktur folder course.
        </p>
      </div>

      <FolderForm
        defaultValues={folder}
        submitLabel="Update Folder"
        action={updateMentorFolderAction}
      />
    </main>
  );
}
