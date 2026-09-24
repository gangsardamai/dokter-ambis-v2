import { notFound } from "next/navigation";

import { setMentorRatingEnabledAction } from "@/app/actions/mentor-rating.actions";
import {
  CourseActionCard,
  CourseInfoCard,
  CourseRelationCard,
} from "@/components/course";
import { Container, PageHeader } from "@/components/layout";
import MentorRatingSection, {
  type MentorRatingItem,
} from "@/components/mentor/MentorRatingSection";
import PendingSubmitButton from "@/components/mentor/PendingSubmitButton";
import { callDynamicRpc } from "@/lib/supabase/dynamic-rpc";
import { createClient } from "@/lib/supabase/server";
import { courseService, profileService } from "@/services";

interface Props {
  params: Promise<{ id: string }>;
}

interface MentorRatingContext {
  enabled: boolean;
  mentors: MentorRatingItem[];
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const [course, profile] = await Promise.all([
    courseService.getCourseById(id),
    profileService.getCurrentProfile(),
  ]);

  if (!course || !profile) notFound();

  const isAdmin = profile.role === "admin";
  const canManageCourseTools =
    profile.role === "admin" || profile.role === "leader";
  let ratingContext: MentorRatingContext = {
    enabled: course.mentor_rating_enabled,
    mentors: [],
  };

  if (isAdmin) {
    const supabase = await createClient();
    ratingContext = await callDynamicRpc<MentorRatingContext>(
      supabase,
      "get_course_mentor_rating_context",
      { target_course_id: id },
    );
  }

  return (
    <Container>
      <PageHeader title={course.title} description="Detail Blok Pembelajaran" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CourseInfoCard course={course} />
          {isAdmin && <CourseRelationCard courseId={course.id} />}
        </div>
        <div>
          <CourseActionCard
            courseId={course.id}
            isAdmin={isAdmin}
            canManageCourseTools={canManageCourseTools}
          />
        </div>
      </div>

      {canManageCourseTools && (
        <>
          <section className="mt-8 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                  Pengaturan Course
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Penilaian Mentor
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Aktifkan fitur ini agar peserta dengan enrollment aktif dapat memberikan bintang dan saran kepada mentor yang sedang ditugaskan.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-black ${
                    ratingContext.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {ratingContext.enabled ? "Aktif" : "Nonaktif"}
                </span>
                <form action={setMentorRatingEnabledAction}>
                  <input type="hidden" name="courseId" value={course.id} />
                  <input
                    type="hidden"
                    name="enabled"
                    value={ratingContext.enabled ? "false" : "true"}
                  />
                  <PendingSubmitButton
                    className={`min-h-10 rounded-xl px-4 text-sm font-black ${
                      ratingContext.enabled
                        ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-[#1769cf] text-white hover:bg-[#0b5ba5]"
                    }`}
                    label={ratingContext.enabled ? "Nonaktifkan" : "Aktifkan"}
                    pendingLabel="Menyimpan..."
                  />
                </form>
              </div>
            </div>
          </section>

          {isAdmin && ratingContext.enabled && (
            <div className="mt-6">
              <MentorRatingSection
                courseId={course.id}
                mentors={ratingContext.mentors}
                title="Beri Penilaian sebagai Admin"
                description="Admin dapat memberi bintang dan saran. Identitas pemberi akan ditampilkan sebagai “Admin” pada halaman mentor."
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
