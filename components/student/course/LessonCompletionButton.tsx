"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { toggleLessonCompletionAction } from "@/app/actions/lesson-progress.actions";

interface LessonCompletionButtonProps {
  courseId: string;
  lessonId: string;
  initialCompleted: boolean;
}

export default function LessonCompletionButton({
  courseId,
  lessonId,
  initialCompleted,
}: LessonCompletionButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setErrorMessage("");

    startTransition(async () => {
      try {
        const result = await toggleLessonCompletionAction(
          courseId,
          lessonId,
        );

        setCompleted(result.completed);
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Status lesson gagal diperbarui.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={completed}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          completed
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 focus:ring-emerald-300"
            : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300"
        }`}
      >
        <span aria-hidden="true">{completed ? "✓" : "○"}</span>
        {isPending
          ? "Menyimpan..."
          : completed
            ? "Sudah Dipelajari · Batalkan"
            : "Selesai Dipelajari"}
      </button>

      {errorMessage && (
        <p className="text-xs font-semibold text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
