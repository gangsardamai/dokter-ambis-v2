"use client";

import { useState, useTransition } from "react";

import {
  promoteStudentToMentorAction,
  resetStudentDevicesAction,
  setStudentPasswordAction,
} from "@/app/dashboard/admin/student/actions";

interface StudentAccountActionsProps {
  studentId: string;
}

interface Feedback {
  success: boolean;
  message: string;
}

export function StudentAccountActions({
  studentId,
}: StudentAccountActionsProps) {
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "device" | "password" | "mentor" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function runAction(
    actionName: "device" | "password" | "mentor",
    action: () => Promise<Feedback>,
    onSuccess?: () => void,
  ) {
    setFeedback(null);
    setPendingAction(actionName);

    startTransition(async () => {
      try {
        const result = await action();
        setFeedback(result);

        if (result.success) {
          onSuccess?.();
        }
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-500">
          Kelola Akun
        </p>
        <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-[#061827]">
          Aksi Mahasiswa
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Aksi hanya dapat dijalankan jika mahasiswa berada dalam scope Leader.
        </p>
      </div>

      {feedback && (
        <div
          role="status"
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-bold ${
            feedback.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-black text-slate-900">Reset Device</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Hapus perangkat aktif agar mahasiswa dapat mendaftarkan perangkat kembali.
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              runAction("device", () => resetStudentDevicesAction(studentId))
            }
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-wait disabled:opacity-60"
          >
            {pendingAction === "device" ? "Mereset..." : "Reset Device"}
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-black text-slate-900">Reset Password</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Pasang password baru minimal 6 karakter.
          </p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Password baru"
            className="mt-3 min-h-10 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            disabled={isPending || password.length < 6}
            onClick={() =>
              runAction(
                "password",
                () => setStudentPasswordAction(studentId, password),
                () => setPassword(""),
              )
            }
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "password" ? "Menyimpan..." : "Simpan Password"}
          </button>
        </article>

        <article className="rounded-2xl border border-slate-200 p-4">
          <h3 className="font-black text-slate-900">Jadikan Mentor</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Ubah role mahasiswa menjadi Mentor. Penugasan course dilakukan terpisah.
          </p>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (
                !window.confirm(
                  "Jadikan akun mahasiswa ini sebagai Mentor? Role mahasiswa akan berubah menjadi Mentor.",
                )
              ) {
                return;
              }

              runAction(
                "mentor",
                () => promoteStudentToMentorAction(studentId),
                () => window.location.assign("/dashboard/admin/mentor"),
              );
            }}
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-60"
          >
            {pendingAction === "mentor" ? "Mengubah..." : "Jadikan Mentor"}
          </button>
        </article>
      </div>
    </section>
  );
}
