"use client";

import { useTransition } from "react";

interface DeletePromotionButtonProps {

  id: string;

  onDelete: (
    id: string
  ) => Promise<void>;

}

export default function DeletePromotionButton({

  id,

  onDelete,

}: DeletePromotionButtonProps) {

  const [pending, startTransition] =
    useTransition();

  function handleDelete() {

    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menghapus promotion ini?"
      );

    if (!confirmed) {

      return;

    }

    startTransition(async () => {

      await onDelete(id);

    });

  }

  return (

    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="
        rounded
        bg-red-600
        px-3
        py-1
        text-white
        hover:bg-red-700
        disabled:opacity-50
      "
    >

      {

        pending
          ? "Deleting..."
          : "Delete"

      }

    </button>

  );

}