"use client";

import { useRouter } from "next/navigation";
import {
  useState,
  useTransition,
} from "react";

import { setCoursePinAction } from "@/app/actions/course-pin.actions";

interface CoursePinButtonProps {
  courseId: string;
  initialPinned: boolean;
  onPinnedChange?: (
    courseId: string,
    pinned: boolean,
  ) => void;
  className?: string;
}

export default function CoursePinButton({
  courseId,
  initialPinned,
  onPinnedChange,
  className = "",
}: CoursePinButtonProps) {
  const router = useRouter();
  const [pinned, setPinned] = useState(initialPinned);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  function handleClick() {
    if (isPending) return;

    const nextPinned = !pinned;
    setStatus("idle");

    startTransition(async () => {
      const result = await setCoursePinAction(
        courseId,
        nextPinned,
      );

      if (!result.success) {
        setStatus("error");
        window.setTimeout(() => setStatus("idle"), 1600);
        return;
      }

      setPinned(nextPinned);
      onPinnedChange?.(courseId, nextPinned);
      setStatus("success");
      router.refresh();

      window.setTimeout(() => {
        setStatus("idle");
      }, 1000);
    });
  }

  const label = pinned ? "Lepas pin course" : "Pin course ke atas";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={label}
      title={label}
      aria-busy={isPending}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-70 ${
        pinned
          ? "border-amber-200 bg-amber-50 text-amber-600"
          : "border-white/25 bg-white/10 text-white hover:bg-white/20"
      } ${className}`}
    >
      {isPending ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      ) : status === "success" ? (
        <span
          aria-hidden="true"
          className="text-sm font-black"
        >
          ✓
        </span>
      ) : status === "error" ? (
        <span
          aria-hidden="true"
          className="text-sm font-black"
        >
          !
        </span>
      ) : (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4.5 w-4.5"
          fill={pinned ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 17v5" />
          <path d="M7 3h10l-2 6 3 3v2H6v-2l3-3-2-6Z" />
        </svg>
      )}
    </button>
  );
}
