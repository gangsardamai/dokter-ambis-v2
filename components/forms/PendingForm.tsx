"use client";

import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { useFormStatus } from "react-dom";

interface PendingFormControlsProps {
  children: ReactNode;
  className?: string;
  pendingMessage?: string;
}

export function PendingFormControls({
  children,
  className,
  pendingMessage = "Sedang memproses. Mohon tunggu.",
}: PendingFormControlsProps) {
  const { pending } = useFormStatus();

  return (
    <fieldset
      disabled={pending}
      aria-busy={pending || undefined}
      className={`m-0 min-w-0 border-0 p-0 ${className ?? ""}`}
    >
      {children}
      {pending && (
        <span className="sr-only" aria-live="polite">
          {pendingMessage}
        </span>
      )}
    </fieldset>
  );
}

interface PendingSubmitButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  pendingLabel?: string;
}

export function PendingSubmitButton({
  children,
  pendingLabel = "Memproses...",
  disabled,
  type = "submit",
  className,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = Boolean(disabled || pending);

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      aria-disabled={isDisabled || undefined}
      className={`${className ?? ""} ${
        pending ? "opacity-80" : ""
      }`}
    >
      <span className="inline-flex items-center justify-center gap-2">
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
    </button>
  );
}
