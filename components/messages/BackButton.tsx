"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BackButtonProps {
  label?: string;
}

export default function BackButton({
  label = "Kembali",
}: BackButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending || undefined}
      onClick={() => {
        if (pending) return;
        setPending(true);
        router.back();
      }}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50 disabled:cursor-wait disabled:opacity-80"
    >
      {pending ? (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-4 w-4 animate-spin"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <circle cx="12" cy="12" r="9" className="opacity-25" />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            className="opacity-90"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <span aria-hidden="true">←</span>
      )}
      <span>{pending ? "Memuat..." : label}</span>
    </button>
  );
}
