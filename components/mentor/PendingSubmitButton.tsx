"use client";

import { useFormStatus } from "react-dom";

interface PendingSubmitButtonProps {
  label: string;
  pendingLabel?: string;
  className?: string;
}

export default function PendingSubmitButton({
  label,
  pendingLabel = "Memproses...",
  className = "",
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} transition disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
