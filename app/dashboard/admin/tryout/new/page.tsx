import Link from "next/link";

import { PageHeader } from "@/components/admin";
import TryoutAdminForm from "@/components/tryout/TryoutAdminForm";
import { courseService } from "@/services";

import { createTryoutAction } from "../actions";

interface NewTryoutPageProps {
  searchParams: Promise<{ error?: string | string[] }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewTryoutPage({
  searchParams,
}: NewTryoutPageProps) {
  const params = await searchParams;
  const courses = await courseService.getCourses();

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          href="/dashboard/admin/tryout"
          className="text-sm font-black text-blue-700 hover:underline"
        >
          ← Kembali ke Try Out
        </Link>
      </div>

      <PageHeader
        title="Tambah Try Out"
        description="Atur course, durasi, jadwal, dan kebijakan publikasi hasil."
      />

      {getParam(params.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {getParam(params.error)}
        </div>
      )}

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <TryoutAdminForm
          action={createTryoutAction}
          courses={courses.map((course) => ({
            value: course.id,
            label: course.title,
          }))}
          submitLabel="Simpan dan Kelola Soal"
        />
      </section>
    </main>
  );
}
