"use client";

import Link from "next/link";
import {
  type ComponentProps,
  type ReactNode,
  useRef,
  useState,
} from "react";

type NextLinkProps = ComponentProps<typeof Link>;

interface PendingLinkProps
  extends Omit<NextLinkProps, "children" | "onNavigate"> {
  children: ReactNode;
  pendingLabel?: string;
}

export default function PendingLink({
  children,
  pendingLabel = "Memuat...",
  className,
  ...props
}: PendingLinkProps) {
  const [pending, setPending] = useState(false);
  const navigationLocked = useRef(false);

  return (
    <Link
      {...props}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      onNavigate={(event) => {
        if (navigationLocked.current) {
          event.preventDefault();
          return;
        }

        navigationLocked.current = true;
        setPending(true);
      }}
      className={`${className ?? ""} ${
        pending ? "pointer-events-none opacity-80" : ""
      }`}
    >
      <span
        className="inline-flex items-center justify-center gap-2"
        aria-live="polite"
      >
        {pending && (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0 animate-spin"
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
        )}
        <span>{pending ? pendingLabel : children}</span>
      </span>
    </Link>
  );
}
