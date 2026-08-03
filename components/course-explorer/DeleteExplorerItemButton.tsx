"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deleteExplorerItemAction } from "@/app/dashboard/explorer-delete-actions";

type ManagerRole = "admin" | "mentor";
type ExplorerResourceType = "folder" | "lesson" | "file";

interface DeleteExplorerItemButtonProps {
  managerRole: ManagerRole;
  resourceType: ExplorerResourceType;
  courseId: string;
  itemId: string;
  itemTitle: string;
  className?: string;
  label?: string;
  redirectHref?: string;
}

function getConfirmationMessage(
  resourceType: ExplorerResourceType,
  itemTitle: string,
): string {
  switch (resourceType) {
    case "folder":
      return `Hapus folder “${itemTitle}”? Folder hanya dapat dihapus jika sudah tidak memiliki lesson atau subfolder.`;
    case "lesson":
      return `Hapus lesson “${itemTitle}”? Seluruh file, video, quiz, progres peserta, dan pesan pada lesson ini akan ikut dihapus permanen.`;
    case "file":
      return `Hapus file “${itemTitle}”? File upload akan dihapus dari storage. File asli di Google Drive tidak ikut dihapus.`;
  }
}

export default function DeleteExplorerItemButton({
  managerRole,
  resourceType,
  courseId,
  itemId,
  itemTitle,
  className,
  label,
  redirectHref,
}: DeleteExplorerItemButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (isPending) {
      return;
    }

    const confirmed = window.confirm(
      getConfirmationMessage(resourceType, itemTitle),
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteExplorerItemAction({
        managerRole,
        resourceType,
        courseId,
        itemId,
      });

      if (!result.success) {
        window.alert(result.message);
        return;
      }

      if (redirectHref) {
        router.push(redirectHref);
        return;
      }

      router.refresh();
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleDelete}
      className={className}
    >
      {isPending ? "Menghapus..." : label ?? "Hapus"}
    </button>
  );
}
