"use client";

import {
  useState,
  useTransition,
} from "react";
import {
  useRouter,
} from "next/navigation";
import type { Database } from "@/supabase/types/database.types";

import {
  activateEnrollmentAction,
  approvePaymentAction,
  cancelEnrollmentAction,
  rejectPaymentAction,
  updateEnrollmentCategoryAction,
} from "@/app/dashboard/admin/enrollment/actions";

type EnrollmentStatus =
  Database["public"]["Enums"]["enrollment_status"];

type EnrollmentCategory =
  Database["public"]["Enums"]["enrollment_category"];

type PaymentStatus =
  Database["public"]["Enums"]["payment_status"];

interface EnrollmentActionButtonsProps {
  enrollmentId: string;
  enrollmentStatus: EnrollmentStatus;
  enrollmentCategory: EnrollmentCategory;
  paymentId: string | null;
  paymentStatus: PaymentStatus | null;
}

export function EnrollmentActionButtons({
    enrollmentId,
  enrollmentStatus,
  enrollmentCategory,
  paymentId,
  paymentStatus,
}: EnrollmentActionButtonsProps) {
    const router =
    useRouter();
  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState<string | null>(null);

  function runAction(
    action: () => Promise<{
      success: boolean;
      message: string;
    }>,
  ) {
    startTransition(async () => {
           const result =
        await action();

      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  function approvePayment() {
    if (!paymentId) {
      return;
    }

    const confirmed = window.confirm(
      "Setujui payment ini dan aktifkan enrollment?",
    );

    if (!confirmed) {
      return;
    }

    runAction(() =>
      approvePaymentAction(
        paymentId,
        enrollmentId,
      ),
    );
  }

  function rejectPayment() {
    if (!paymentId) {
      return;
    }

    const notes = window.prompt(
      "Masukkan alasan penolakan payment:",
    );

    if (notes === null) {
      return;
    }

    runAction(() =>
      rejectPaymentAction(
        paymentId,
        enrollmentId,
        notes,
      ),
    );
  }

  function activateEnrollment() {
    const confirmed = window.confirm(
      "Aktifkan enrollment ini secara manual?",
    );

    if (!confirmed) {
      return;
    }

    runAction(() =>
      activateEnrollmentAction(
        enrollmentId,
      ),
    );
  }

  function cancelEnrollment() {
    const confirmed = window.confirm(
      "Batalkan enrollment ini?",
    );

    if (!confirmed) {
      return;
    }

    runAction(() =>
      cancelEnrollmentAction(
        enrollmentId,
      ),
    );
  }

  function updateCategory(
    category: EnrollmentCategory,
  ) {
    if (category === enrollmentCategory) {
      return;
    }

    runAction(() =>
      updateEnrollmentCategoryAction(
        enrollmentId,
        category,
      ),
    );
  }

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">
        Tindakan Admin
      </h2>

      <div className="flex flex-wrap gap-3">
        {paymentId &&
          paymentStatus !== "approved" && (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={approvePayment}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                Setujui Payment
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={rejectPayment}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Tolak Payment
              </button>
            </>
          )}

        {enrollmentStatus !== "active" && (
          <button
            type="button"
            disabled={isPending}
            onClick={activateEnrollment}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Aktifkan Enrollment
          </button>
        )}

        {enrollmentStatus !== "cancelled" && (
          <button
            type="button"
            disabled={isPending}
            onClick={cancelEnrollment}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Batalkan Enrollment
          </button>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-medium">
          Kategori Enrollment
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            disabled={
              isPending ||
              enrollmentCategory === "regular"
            }
            onClick={() =>
              updateCategory("regular")
            }
            className="rounded-md border px-4 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            Reguler
          </button>

          <button
            type="button"
            disabled={
              isPending ||
              enrollmentCategory === "separated"
            }
            onClick={() =>
              updateCategory("separated")
            }
            className="rounded-md border px-4 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
          >
            Terpisah
          </button>
        </div>
      </div>

      {isPending && (
        <p className="mt-4 text-sm text-gray-500">
          Sedang memproses...
        </p>
      )}

      {message && !isPending && (
        <p className="mt-4 text-sm text-gray-600">
          {message}
        </p>
      )}
    </section>
  );
}