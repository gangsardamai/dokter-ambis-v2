import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import TryoutAdminForm from "@/components/tryout/TryoutAdminForm";
import {
  mentorCourseAccessService,
  profileService,
} from "@/services";

import { createMentorTryoutAction } from "../actions";

interface NewTryoutPageProps {
  searchParams: Promise<{ error?: string | string[] }>;
}

function getParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewMentorTryoutPage({
  searchParams,
}: NewTryoutPageProps) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "mentor") redirect("/dashboard");

  const [params, courses] = await Promise.all([
    searchParams,
    mentorCourseAccessService.getAssignedCourses(profile.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-7 p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/mentor/tryout"
        className="text-sm font-black text-blue-700 hover:underline"
      >
        ← Kembali ke Try Out
      </Link>

      <PageHeader
        title="Tambah Try Out"
        description="Try Out hanya dapat dibuat pada course yang ditugaskan kepada Anda."
      />

      {getParam(params.error) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {getParam(params.error)}
        </div>
      )}

      {courses.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center">
          <p className="font-black text-slate-900">
            Belum ada course yang ditugaskan.
          </p>
        </section>
      ) : (
        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
          <TryoutAdminForm
            action={createMentorTryoutAction}
            courses={courses.map((course) => ({
              value: course.id,
              label: course.title,
            }))}
            submitLabel="Simpan dan Kelola Soal"
          />
        </section>
      )}
    </main>
  );
}
