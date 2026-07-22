"use client";

import { useTransition } from "react";

interface DeleteProgramButtonProps {

  id: string;

  onDelete: (
    id: string
  ) => Promise<void>;

}

export default function DeleteProgramButton({

  id,

  onDelete,

}: DeleteProgramButtonProps) {

  const [pending, startTransition] =
    useTransition();

  function handleDelete() {

    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menghapus program ini?"
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
      className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
    >

      {

        pending
          ? "Menghapus..."
          : "Hapus"

      }

    </button>

  );

}