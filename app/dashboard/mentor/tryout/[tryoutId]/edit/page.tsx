import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { PendingSubmitButton } from "@/components/forms/PendingForm";
import TryoutAdminForm from "@/components/tryout/TryoutAdminForm";
import {
  mentorCourseAccessService,
  profileService,
  tryoutService,
} from "@/services";

import {
  deleteMentorTryoutAction,
  updateMentorTryoutAction,
} from "../../actions";

interface EditTryoutPageProps {
  params: Promise<{ tryoutId: string }>;
  searchParams: Promise<{
    error?: string | string[];
    saved?: string | string[];
  }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function EditMentorTryoutPage({
  params,
  searchParams,
}: EditTryoutPageProps) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "mentor") redirect("/dashboard");

  const { tryoutId } = await params;
  const [query, payload, courses] = await Promise.all([
    searchParams,
    tryoutService.getMentorEditorPayload(profile.id, tryoutId),
    mentorCourseAccessService.getAssignedCourses(profile.id),
  ]);

  if (!payload) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/mentor/tryout"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke Try Out
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/mentor/tryout/${tryoutId}/questions`}
            className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700"
          >
            Kelola Soal
          </Link>
          <Link
            href={`/dashboard/mentor/tryout/${tryoutId}/results`}
            className="inline-flex min-h-10 items-center rounded-xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700"
          >
            Lihat Hasil
          </Link>
        </div>
      </div>

      <PageHeader
        title="Pengaturan Try Out"
        description={`${payload.tryout.title} · ${payload.course?.title ?? "Course"}`}
      />

      {getParam(query.saved) === "true" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          Pengaturan Try Out berhasil disimpan.
        </div>
      )}
      {getParam(query.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {getParam(query.error)}
        </div>
      )}

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <TryoutAdminForm
          action={updateMentorTryoutAction.bind(null, tryoutId)}
          courses={courses.map((course) => ({
            value: course.id,
            label: course.title,
          }))}
          tryout={payload.tryout}
          submitLabel="Simpan Perubahan"
        />
      </section>

      <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-black text-red-700">Hapus Try Out</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Seluruh soal, attempt, jawaban, dan hasil peserta pada Try Out ini akan ikut terhapus.
        </p>
        <form
          action={deleteMentorTryoutAction.bind(null, tryoutId)}
          className="mt-4"
        >
          <PendingSubmitButton
            pendingLabel="Menghapus..."
            className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-80"
          >
            Hapus Try Out
          </PendingSubmitButton>
        </form>
      </section>
    </main>
  );
}
