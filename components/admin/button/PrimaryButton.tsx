"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

interface PrimaryButtonProps {
  href?: string;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  loadingLabel?: string;
}

function LoadingContent({ label }: { label: string }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
      />
      <span>{label}</span>
    </>
  );
}

export default function PrimaryButton({
  href,
  children,
  type = "button",
  className = "",
  disabled = false,
  loadingLabel = "Memuat...",
}: PrimaryButtonProps) {
  const { pending } = useFormStatus();
  const [isNavigating, setIsNavigating] = useState(false);

  const baseClassName =
    `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        aria-busy={isNavigating}
        aria-disabled={isNavigating}
        onClick={(event) => {
          if (isNavigating) {
            event.preventDefault();
            return;
          }

          setIsNavigating(true);
        }}
        className={baseClassName}
      >
        {isNavigating ? (
          <LoadingContent label={loadingLabel} />
        ) : (
          children
        )}
      </Link>
    );
  }

  const isLoading = type === "submit" && pending;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={baseClassName}
    >
      {isLoading ? (
        <LoadingContent label={loadingLabel} />
      ) : (
        children
      )}
    </button>
  );
}
