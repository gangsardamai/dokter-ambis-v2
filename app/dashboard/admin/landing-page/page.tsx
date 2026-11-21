import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import { defaultMentors } from "@/lib/landing-page";
import { profileService } from "@/services";
import {
  getFeaturedCourseIds,
  getLandingPageSettings,
  getPublicLandingCourses,
  mentorPhotoUrl,
} from "@/services/landing-page.service";

import LandingPageForm from "./LandingPageForm";

export default async function LandingPageAdmin({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const profile = await profileService.getCurrentProfile();
  if (profile?.role !== "admin" || profile.status !== "active") redirect("/dashboard");

  const [settings, courses, query] = await Promise.all([
    getLandingPageSettings(),
    getPublicLandingCourses(),
    searchParams,
  ]);
  const options = courses.map((course) => ({
    id: course.id,
    label: [course.title, course.organization?.title, course.program?.title]
      .filter(Boolean).join(" · "),
  }));
  const savedIds = getFeaturedCourseIds(courses, settings.course_ids);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader title="Landing Page" description="Atur kelas pilihan dan kartu mentor di beranda Dokter Ambis." />
      <Link href="/" className="inline-block text-sm font-semibold text-blue-700">Lihat beranda →</Link>

      {query.saved === "1" && (
        <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          Perubahan sudah tampil di beranda.
        </p>
      )}
      {savedIds.some((id) => !options.some((option) => option.id === id)) && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          Ada kelas pilihan yang sudah nonaktif. Pilih penggantinya jika diperlukan.
        </p>
      )}
      <LandingPageForm
        key={settings.revision}
        revision={settings.revision}
        courses={options}
        selectedIds={savedIds.map((id) => options.some((option) => option.id === id) ? id : "")}
        mentors={(settings.mentors ?? defaultMentors).map((mentor) => ({
          ...mentor,
          photoUrl: mentorPhotoUrl(mentor.image),
        }))}
      />
    </main>
  );
}
