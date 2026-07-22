"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import {
  approveAllEnrollmentsAction,
  approveAllPaymentsAction,
} from "@/app/dashboard/admin/enrollment/actions";

type ActionResult = {
  success: boolean;
  message: string;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function BulkApprovalButtons() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  function handleResult(result: ActionResult) {
    setMessage(result.message);
    setIsSuccess(result.success);

    if (result.success) {
      router.refresh();
    }
  }

  function approveAllEnrollments() {
    const confirmed = window.confirm(
      "Setujui semua enrollment yang berstatus menunggu verifikasi?",
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setIsSuccess(null);

    startTransition(async () => {
      const result = await approveAllEnrollmentsAction();
      handleResult(result);
    });
  }

  function approveAllPayments() {
    const confirmed = window.confirm(
      "Setujui semua payment pending dan aktifkan enrollment terkait?",
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setIsSuccess(null);

    startTransition(async () => {
      const result = await approveAllPaymentsAction();
      handleResult(result);
    });
  }

  return (
    <div className="w-full space-y-3 sm:w-auto">
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={isPending}
          onClick={approveAllEnrollments}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <CheckIcon />
          {isPending ? "Memproses..." : "Setujui Semua Enrollment"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={approveAllPayments}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1769cf] to-[#033b63] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <CheckIcon />
          {isPending ? "Memproses..." : "Setujui Semua Payment"}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm ${
            isSuccess
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
