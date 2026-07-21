"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  approveAllEnrollmentsAction,
  approveAllPaymentsAction,
} from "@/app/dashboard/admin/enrollment/actions";

type ActionResult = {
  success: boolean;
  message: string;
};

export function BulkApprovalButtons() {
    const router =
    useRouter();
  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  const [isSuccess, setIsSuccess] =
    useState<boolean | null>(null);

    function handleResult(
    result: ActionResult,
  ) {
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
      const result =
        await approveAllEnrollmentsAction();

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
      const result =
        await approveAllPaymentsAction();

      handleResult(result);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={approveAllEnrollments}
          className="
            rounded-md
            bg-green-600
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-green-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {isPending
            ? "Memproses..."
            : "Setujui Semua Enrollment"}
        </button>

        <button
          type="button"
          disabled={isPending}
          onClick={approveAllPayments}
          className="
            rounded-md
            bg-blue-600
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-blue-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {isPending
            ? "Memproses..."
            : "Setujui Semua Payment"}
        </button>
      </div>

      {message && (
        <div
          className={`
            rounded-md
            border
            px-4
            py-3
            text-sm
            ${
              isSuccess
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }
          `}
        >
          {message}
        </div>
      )}
    </div>
  );
}