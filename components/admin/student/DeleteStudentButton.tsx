"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  deleteStudentAccountAction,
  promoteStudentToMentorAction,
  resetStudentDevicesAction,
  setStudentPasswordAction,
} from "@/app/dashboard/admin/student/actions";

interface DeleteStudentButtonProps {
  studentId: string;
  fullName: string;
  email: string;
}

type ActionMode =
  | "reset-device"
  | "reset-password"
  | "promote-mentor"
  | "delete"
  | null;

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function DeviceIcon() {
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
      <rect x="4" y="3" width="16" height="12" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 15v6" />
      <path d="M8.5 9.5a5 5 0 0 1 7-3.7" />
      <path d="m15.5 3.8.2 3.5-3.5.2" />
    </svg>
  );
}

function KeyIcon() {
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
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9" />
      <path d="m16 7 2 2" />
      <path d="m18 5 2 2" />
    </svg>
  );
}

function MentorIcon() {
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
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21a6 6 0 0 1 12 0" />
      <path d="M18 8v6" />
      <path d="M15 11h6" />
    </svg>
  );
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

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </svg>
  );
}

export function DeleteStudentButton({
  studentId,
  fullName,
  email,
}: DeleteStudentButtonProps) {
  const router = useRouter();
  const [mode, setMode] = useState<ActionMode>(null);
  const [confirmation, setConfirmation] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete =
    Boolean(email) && normalizeEmail(confirmation) === normalizeEmail(email);
  const canSetPassword =
    newPassword.trim().length >= 6 &&
    newPassword === passwordConfirmation;

  function openModal(nextMode: Exclude<ActionMode, null>) {
    setMode(nextMode);
    setConfirmation("");
    setNewPassword("");
    setPasswordConfirmation("");
    setModalMessage(null);
    setResultMessage(null);
  }

  function closeModal() {
    if (isPending) {
      return;
    }

    setMode(null);
    setConfirmation("");
    setNewPassword("");
    setPasswordConfirmation("");
    setModalMessage(null);
  }

  function executeAction() {
    if (!mode || isPending) {
      return;
    }

    if (mode === "delete" && !canDelete) {
      return;
    }

    if (mode === "reset-password" && !canSetPassword) {
      return;
    }

    startTransition(async () => {
      const result =
        mode === "reset-device"
          ? await resetStudentDevicesAction(studentId)
          : mode === "reset-password"
            ? await setStudentPasswordAction(studentId, newPassword)
            : mode === "promote-mentor"
              ? await promoteStudentToMentorAction(studentId)
              : await deleteStudentAccountAction(studentId, confirmation);

      if (!result.success) {
        setModalMessage(result.message);
        return;
      }

      const completedMode = mode;
      setMode(null);
      setConfirmation("");
      setNewPassword("");
      setPasswordConfirmation("");
      setModalMessage(null);

      if (
        completedMode === "reset-device" ||
        completedMode === "reset-password"
      ) {
        setResultMessage(result.message);
      }

      router.refresh();
    });
  }

  const modalTitle =
    mode === "reset-device"
      ? `Reset device ${fullName}?`
      : mode === "reset-password"
        ? `Ubah password ${fullName}`
        : mode === "promote-mentor"
          ? `Jadikan ${fullName} sebagai mentor?`
          : `Hapus akun ${fullName}?`;

  const modalEyebrow =
    mode === "delete"
      ? "Tindakan permanen"
      : mode === "promote-mentor"
        ? "Perubahan role"
        : "Kelola akun";

  const modalAccentClass =
    mode === "delete"
      ? "border-red-100 bg-red-100 text-red-700"
      : mode === "promote-mentor"
        ? "border-violet-100 bg-violet-100 text-violet-700"
        : mode === "reset-password"
          ? "border-amber-100 bg-amber-100 text-amber-700"
          : "border-blue-100 bg-blue-100 text-blue-700";

  const submitClass =
    mode === "delete"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-200 disabled:bg-red-300"
      : mode === "promote-mentor"
        ? "bg-violet-600 hover:bg-violet-700 focus:ring-violet-200 disabled:bg-violet-300"
        : mode === "reset-password"
          ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200 disabled:bg-amber-300"
          : "bg-[#1769cf] hover:bg-[#0f5cb7] focus:ring-blue-200 disabled:bg-blue-300";

  const submitLabel =
    mode === "reset-device"
      ? isPending
        ? "Mereset..."
        : "Reset Device"
      : mode === "reset-password"
        ? isPending
          ? "Menyimpan..."
          : "Pasang Password"
        : mode === "promote-mentor"
          ? isPending
            ? "Mengubah Role..."
            : "Jadikan Mentor"
          : isPending
            ? "Menghapus..."
            : "Hapus Permanen";

  return (
    <>
      <div className="grid w-full grid-cols-2 gap-2 xl:min-w-[250px]">
        <button
          type="button"
          onClick={() => openModal("reset-device")}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-[#1769cf] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <DeviceIcon />
          Reset Device
        </button>

        <button
          type="button"
          onClick={() => openModal("reset-password")}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-200"
        >
          <KeyIcon />
          Reset Password
        </button>

        <button
          type="button"
          onClick={() => openModal("promote-mentor")}
          className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-700 transition hover:bg-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-200"
        >
          <MentorIcon />
          Jadikan Mentor
        </button>

        <button
          type="button"
          disabled={!email}
          onClick={() => openModal("delete")}
          className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
        >
          <TrashIcon />
          Hapus Akun
        </button>

        {resultMessage && (
          <p className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-700">
            {resultMessage}
          </p>
        )}
      </div>

      {mode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`student-action-${studentId}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start gap-4">
              <div
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${modalAccentClass}`}
              >
                {mode === "reset-device" ? (
                  <DeviceIcon />
                ) : mode === "reset-password" ? (
                  <KeyIcon />
                ) : mode === "promote-mentor" ? (
                  <MentorIcon />
                ) : (
                  <TrashIcon />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  {modalEyebrow}
                </p>
                <h2
                  id={`student-action-${studentId}`}
                  className="mt-1 break-words text-2xl font-black tracking-[-0.04em] text-[#061827]"
                >
                  {modalTitle}
                </h2>
              </div>

              <button
                type="button"
                aria-label="Tutup"
                disabled={isPending}
                onClick={closeModal}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <CloseIcon />
              </button>
            </div>

            {mode === "reset-device" && (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-900">
                Semua catatan perangkat login peserta akan dihapus. Saat login
                berikutnya, perangkat akan didaftarkan kembali dari awal. Akun,
                enrollment, progress, quiz, dan data belajar lainnya tidak
                berubah.
              </div>
            )}

            {mode === "reset-password" && (
              <>
                <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">
                  Masukkan password baru secara manual. Password lama tidak
                  ditampilkan, tidak dibuat password sementara, dan peserta
                  tidak dipaksa mengganti password lagi setelah login.
                </div>

                <label
                  htmlFor={`new-password-${studentId}`}
                  className="mt-5 block text-sm font-bold text-slate-700"
                >
                  Password baru
                </label>
                <input
                  id={`new-password-${studentId}`}
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  disabled={isPending}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setModalMessage(null);
                  }}
                  placeholder="Minimal 6 karakter"
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
                />

                <label
                  htmlFor={`confirm-password-${studentId}`}
                  className="mt-4 block text-sm font-bold text-slate-700"
                >
                  Ulangi password baru
                </label>
                <input
                  id={`confirm-password-${studentId}`}
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  disabled={isPending}
                  onChange={(event) => {
                    setPasswordConfirmation(event.target.value);
                    setModalMessage(null);
                  }}
                  placeholder="Ketik ulang password"
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
                />

                {passwordConfirmation &&
                  newPassword !== passwordConfirmation && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      Password belum sama.
                    </p>
                  )}
              </>
            )}

            {mode === "promote-mentor" && (
              <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-semibold leading-6 text-violet-900">
                Role akun akan berubah dari mahasiswa menjadi mentor. Enrollment,
                pembayaran, progress lesson, quiz, dan riwayat lainnya tetap
                tersimpan. Setelah berhasil, akun tidak lagi muncul pada daftar
                mahasiswa dan dapat diberi penugasan course sebagai mentor.
              </div>
            )}

            {mode === "delete" && (
              <>
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
                    setModalMessage(null);
                  }}
                  placeholder="Masukkan email akun"
                  className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 disabled:bg-slate-100"
                />
              </>
            )}

            {modalMessage && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {modalMessage}
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
                disabled={
                  isPending ||
                  (mode === "delete" && !canDelete) ||
                  (mode === "reset-password" && !canSetPassword)
                }
                onClick={executeAction}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed ${submitClass}`}
              >
                {mode === "reset-device" ? (
                  <DeviceIcon />
                ) : mode === "reset-password" ? (
                  <KeyIcon />
                ) : mode === "promote-mentor" ? (
                  <MentorIcon />
                ) : (
                  <TrashIcon />
                )}
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
