import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import AnnouncementForm from "@/components/admin/announcement/AnnouncementForm";

import {
  courseService,
  organizationService,
} from "@/services";

import { createAnnouncementAction } from "../actions";

export default async function CreateAnnouncementPage() {
  const [organizations, courses] = await Promise.all([
    organizationService.getActiveUniversities(),
    courseService.getAvailableCourseDetails(),
  ]);

  async function create(formData: FormData) {
    "use server";

    const result = await createAnnouncementAction(formData);
    if (!result.success) {
      throw new Error(result.message);
    }

    redirect("/dashboard/admin/announcements");
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Buat Pengumuman"
        description="Tulis pengumuman dan tentukan peserta yang akan menerimanya."
        actions={(
          <Link
            href="/dashboard/admin/announcements"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-blue-100 bg-white px-5 py-2.5 text-sm font-bold text-[#1769cf] shadow-sm transition hover:bg-blue-50 sm:w-auto"
          >
            ← Kembali
          </Link>
        )}
      />

      <AnnouncementForm
        organizations={organizations.map((organization) => ({
          id: organization.id,
          title: organization.title,
          shortName: organization.short_name,
        }))}
        courses={courses.map((course) => ({
          id: course.id,
          title: course.title,
          organizationId: course.organization_id,
        }))}
        submitLabel="Simpan Pengumuman"
        action={create}
      />
    </main>
  );
}
