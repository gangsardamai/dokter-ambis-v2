import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { PendingSubmitButton } from "@/components/forms/PendingForm";
import {
  courseService,
  leaderAccessService,
} from "@/services";

import { createEnrollmentAction } from "../actions";

export default async function CreateEnrollmentPage() {
  try {
    await leaderAccessService.requireStaffPermission("manage_enrollment");
  } catch {
    redirect("/dashboard");
  }

  const courses = (await courseService.getCourses())
    .filter((course) => course.status === "active")
    .sort((a, b) => a.title.localeCompare(b.title, "id"));

  async function create(formData: FormData) {
    "use server";

    const result = await createEnrollmentAction(formData);
    if (!result.success || !result.enrollmentId) {
      throw new Error(result.message);
    }

    redirect(`/dashboard/admin/enrollment/${result.enrollmentId}`);
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Tambah Enrollment"
        description="Tambahkan peserta ke Course dalam scope Anda menggunakan nomor WhatsApp akun peserta."
        actions={
          <Link
            href="/dashboard/admin/enrollment"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-100 bg-white px-5 text-sm font-bold text-[#1769cf]"
          >
            ← Kembali
          </Link>
        }
      />

      <form
        action={create}
        className="space-y-6 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
      >
        <label className="block space-y-2">
          <span className="text-sm font-black text-slate-700">
            Nomor WhatsApp Peserta
          </span>
          <input
            type="tel"
            name="phone"
            required
            placeholder="Contoh: 081234567890"
            className="min-h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <span className="block text-xs text-slate-500">
            Pencarian menggunakan nomor yang sama dengan akun peserta dan tidak membuka daftar mahasiswa global.
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-black text-slate-700">Course</span>
          <select
            name="course_id"
            required
            defaultValue=""
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
          >
            <option value="" disabled>Pilih Course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-700">
              Kategori Enrollment
            </span>
            <select
              name="category"
              defaultValue="regular"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
            >
              <option value="regular">Reguler</option>
              <option value="separated">Terpisah</option>
            </select>
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-black text-slate-700">
              Kategori Pembayaran
            </span>
            <select
              name="payment_timing"
              defaultValue="upfront"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm"
            >
              <option value="upfront">Bayar di Awal</option>
              <option value="deferred">Bayar di Akhir</option>
            </select>
          </label>
        </div>

        <div className="rounded-2xl bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-800">
          Bayar di Awal tetap memerlukan verifikasi payment oleh Admin. Leader
          dapat menyetujui enrollment Bayar di Akhir selama Course berada di scope.
        </div>

        <PendingSubmitButton
          pendingLabel="Menyimpan..."
          className="min-h-11 w-full rounded-xl bg-[#1769cf] px-5 text-sm font-black text-white disabled:cursor-not-allowed sm:w-auto"
        >
          Buat Enrollment
        </PendingSubmitButton>
      </form>
    </main>
  );
}
