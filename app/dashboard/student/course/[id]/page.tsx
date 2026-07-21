import Link from "next/link";
import { notFound } from "next/navigation";

import {
  courseService,
} from "@/services";
import {
  enrollCourseAction,
} from "./actions";
interface StudentCourseDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatRupiah(
  value: number,
): string {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

export default async function StudentCourseDetailPage({
  params,
}: StudentCourseDetailPageProps) {
  const { id } = await params;

    const course =
    await courseService
      .getAvailableCourseDetailById(
        id,
      );

  if (!course) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link
        href="/dashboard/student"
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        ← Kembali ke daftar blok
      </Link>

      <article className="mt-6 rounded-2xl border bg-white p-8 shadow-sm">
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          Aktif
        </span>

        <h1 className="mt-5 text-3xl font-bold text-gray-900">
          {course.title}
        </h1>
<div className="mt-5 grid gap-4 sm:grid-cols-2">
  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      Universitas
    </p>

    <p className="mt-1 font-semibold text-gray-900">
      {course.organization?.title ??
        "Universitas belum tersedia"}
    </p>

    {course.organization?.short_name && (
      <p className="mt-1 text-sm text-gray-500">
        {course.organization.short_name}
      </p>
    )}
  </div>

  <div className="rounded-xl bg-gray-50 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      Program
    </p>

    <p className="mt-1 font-semibold text-gray-900">
      {course.program?.title ??
        "Program belum tersedia"}
    </p>
  </div>
</div>
        <p className="mt-5 leading-7 text-gray-600">
          {course.description ??
            "Deskripsi blok pembelajaran belum tersedia."}
        </p>

        <div className="mt-8 border-t pt-6">
          <p className="text-sm text-gray-500">
            Harga blok
          </p>

          <p className="mt-1 text-2xl font-bold text-blue-600">
            {course.is_free
              ? "Gratis"
              : formatRupiah(course.price)}
          </p>
        </div>

               <form
          action={enrollCourseAction.bind(
            null,
            course.id,
          )}
          className="mt-8"
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Daftar Blok
          </button>
        </form>
      </article>
    </main>
  );
}