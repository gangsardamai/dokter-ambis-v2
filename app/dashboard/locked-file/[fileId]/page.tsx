import { notFound, redirect } from "next/navigation";

import LockedPdfViewer from "@/components/file/LockedPdfViewer";
import {
  lessonFileService,
  profileService,
} from "@/services";

export default async function LockedFilePage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = await params;

  const [profile, file] = await Promise.all([
    profileService.getCurrentProfile(),
    lessonFileService.getFileById(fileId),
  ]);

  if (!profile) {
    redirect("/login");
  }

  if (
    !file ||
    file.access_mode !== "locked" ||
    file.file_type !== "pdf"
  ) {
    notFound();
  }

  return (
    <LockedPdfViewer
      fileId={file.id}
      title={file.title}
      watermarkText={`${profile.full_name || "Pengguna"} • DokterAmbis`}
    />
  );
}
