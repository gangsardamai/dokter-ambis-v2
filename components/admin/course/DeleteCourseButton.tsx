"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/types/action-result";

interface DeleteCourseButtonProps {
  id: string;
  title: string;
  onDelete: (id: string) => Promise<ActionResult>;
}

export default function DeleteCourseButton({ id, title, onDelete }: DeleteCourseButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Hapus course "${title}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await onDelete(id);
        if (!result.success) {
          setMessage(result.message);
          return;
        }
        router.refresh();
      } catch {
        setMessage("Terjadi gangguan saat menghapus course. Coba lagi.");
      }
    });
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-busy={pending}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-700" />}
        {pending ? "Menghapus..." : "Hapus"}
      </button>
      {message && <p role="alert" className="mt-2 max-w-xs text-xs font-medium text-red-700">{message}</p>}
    </div>
  );
}
