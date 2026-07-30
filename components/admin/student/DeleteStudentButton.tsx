"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteStudentAccountAction } from "@/app/dashboard/admin/student/actions";

interface DeleteStudentButtonProps {
  studentId: string;
  fullName: string;
  email: string;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export function DeleteStudentButton({
  studentId,
  fullName,
  email,
}: DeleteStudentButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canDelete =
    Boolean(email) && normalizeEmail(confirmation) === normalizeEmail(email);

  function closeModal() {
    if (isPending) {
      return;
    }

    setIsOpen(false);
    setConfirmation("");
    setMessage(null);
  }

  function deleteAccount() {
    if (!canDelete || isPending) {
      return;
    }

    startTransition(async () => {
      const result = await deleteStudentAccountAction(
        studentId,
        confirmation,
      );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setIsOpen(false);
      setConfirmation("");
      setMessage(null);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={!email}
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300 xl:w-auto"
      >
        <TrashIcon />
        Hapus Akun
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-student-${studentId}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700">
                <TrashIcon />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-red-500">
                  Tindakan permanen
                </p>
                <h2
                  id={`delete-student-${studentId}`}
                  className="mt-1 break-words text-2xl font-black tracking-[-0.04em] text-[#061827]"
                >
                  Hapus akun {fullName}?
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-800">
              Enrollment, pembayaran, bukti pembayaran, progres lesson, quiz,
              tryout, pesan, dan perangkat login akan ikut terhapus. Data tidak
              dapat dipulihkan melalui website.
            </div>

            <label
              htmlFor={`confirmation-${studentId}`}
              className="mt-5 block text-sm font-bold text-slate-700"
            >
              Ketik email berikut untuk mengonfirmasi:
            </label>
            <p className="mt-2 break-all rounded-xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-800">
              {email || "Email akun tidak tersedia"}
            </p>
            <input
              id={`confirmation-${studentId}`}
              type="email"
              autoComplete="off"
              value={confirmation}
              disabled={isPending || !email}
              onChange={(event) => {
                setConfirmation(event.target.value);
                setMessage(null);
              }}
              placeholder="Masukkan email akun"
              className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
            />

            {message && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {message}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={closeModal}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!canDelete || isPending}
                onClick={deleteAccount}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                <TrashIcon />
                {isPending ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
