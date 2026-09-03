import { redirect } from "next/navigation";

import BackButton from "@/components/messages/BackButton";
import StudentQuestionForm from "@/components/messages/StudentQuestionForm";
import { enrollmentService, profileService } from "@/services";

export default async function NewStudentMessagePage() {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "student") redirect("/dashboard");

  const enrollments = await enrollmentService.getActiveCourseEnrollments(
    profile.id,
  );
  const courses = enrollments.flatMap((enrollment) => {
    const course = enrollment.courses;
    if (!course) return [];
    return [{
      id: course.id,
      title: course.title,
      context: [course.organizations?.title, course.programs?.title]
        .filter(Boolean)
        .join(" · "),
    }];
  });

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6 lg:p-8">
      <BackButton label="Kembali ke Kotak Pesan" />

      <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
          Kotak Pesan
        </p>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
          Buat Pertanyaan
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Pertanyaan akan masuk ke Admin dan seluruh Mentor yang ditugaskan
          pada course pilihan Anda.
        </p>

        <div className="mt-7">
          {courses.length > 0 ? (
            <StudentQuestionForm courses={courses} />
          ) : (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              Anda belum memiliki course aktif untuk membuat pertanyaan.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
