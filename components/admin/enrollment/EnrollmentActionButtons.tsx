"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
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

const actionClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

export function EnrollmentActionButtons({
  enrollmentId,
  enrollmentStatus,
  enrollmentCategory,
  paymentId,
  paymentStatus,
}: EnrollmentActionButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  function runAction(
    action: () => Promise<{
      success: boolean;
      message: string;
    }>,
  ) {
    startTransition(async () => {
      const result = await action();

      setMessage(result.message);
      setIsSuccess(result.success);

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

  function updateCategory(category: EnrollmentCategory) {
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
    <section className="rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1769cf]">
          Tindakan Admin
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-[-0.04em] text-[#061827]">
          Kelola status enrollment
        </h2>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {paymentId && paymentStatus !== "approved" && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={approvePayment}
              className={`${actionClass} bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-200`}
            >
              Setujui Payment
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={rejectPayment}
              className={`${actionClass} bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-200`}
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
            className={`${actionClass} bg-gradient-to-r from-[#1769cf] to-[#033b63] text-white hover:-translate-y-0.5 hover:shadow-md focus:ring-blue-300`}
          >
            Aktifkan Enrollment
          </button>
        )}

        {enrollmentStatus !== "cancelled" && (
          <button
            type="button"
            disabled={isPending}
            onClick={cancelEnrollment}
            className={`${actionClass} border border-red-200 bg-white text-red-700 hover:bg-red-50 focus:ring-red-200`}
          >
            Batalkan Enrollment
          </button>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-3 text-sm font-bold text-slate-700">
          Kategori Enrollment
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={isPending || enrollmentCategory === "regular"}
            onClick={() => updateCategory("regular")}
            className={`${actionClass} border border-blue-100 bg-blue-50 text-[#1769cf] hover:bg-blue-100 focus:ring-blue-200 disabled:bg-slate-100 disabled:text-slate-400`}
          >
            Reguler
          </button>

          <button
            type="button"
            disabled={isPending || enrollmentCategory === "separated"}
            onClick={() => updateCategory("separated")}
            className={`${actionClass} border border-blue-100 bg-blue-50 text-[#1769cf] hover:bg-blue-100 focus:ring-blue-200 disabled:bg-slate-100 disabled:text-slate-400`}
          >
            Terpisah
          </button>
        </div>
      </div>

      {isPending && (
        <p className="mt-4 text-sm font-semibold text-slate-500">
          Sedang memproses...
        </p>
      )}

      {message && !isPending && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-semibold ${
          isSuccess
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}
        >
          {message}
        </div>
      )}
    </section>
  );
}
