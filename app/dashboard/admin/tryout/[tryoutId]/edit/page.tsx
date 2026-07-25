import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin";
import TryoutAdminForm from "@/components/tryout/TryoutAdminForm";
import { courseService, tryoutService } from "@/services";

import {
  deleteTryoutAction,
  updateTryoutAction,
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

export default async function EditTryoutPage({
  params,
  searchParams,
}: EditTryoutPageProps) {
  const { tryoutId } = await params;
  const query = await searchParams;
  const [payload, courses] = await Promise.all([
    tryoutService.getEditorPayload(tryoutId),
    courseService.getCourses(),
  ]);

  if (!payload) notFound();

  const updateAction = updateTryoutAction.bind(null, tryoutId);
  const deleteAction = deleteTryoutAction.bind(null, tryoutId);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/admin/tryout"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke Try Out
        </Link>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/admin/tryout/${tryoutId}/questions`}
            className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-black text-blue-700"
          >
            Kelola Soal
          </Link>
          <Link
            href={`/dashboard/admin/tryout/${tryoutId}/results`}
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
          action={updateAction}
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
        <form action={deleteAction} className="mt-4">
          <button
            type="submit"
            className="inline-flex min-h-10 items-center rounded-xl bg-red-50 px-4 py-2 text-sm font-black text-red-700 transition hover:bg-red-100"
          >
            Hapus Try Out
          </button>
        </form>
      </section>
    </main>
  );
}
