import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/admin";
import AnnouncementForm from "@/components/admin/announcement/AnnouncementForm";

import {
  announcementService,
  courseService,
  leaderAccessService,
  organizationService,
} from "@/services";

import { updateAnnouncementAction } from "../../actions";

interface EditAnnouncementPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditAnnouncementPage({
  params,
}: EditAnnouncementPageProps) {
  const { id } = await params;
  let profile;
  try {
    profile = await leaderAccessService.requireStaffPermission(
      "manage_announcements",
    );
  } catch {
    redirect("/dashboard");
  }

  const [announcement, organizations, courses] =
    await Promise.all([
      announcementService.getAdminAnnouncementById(id),
      organizationService.getActiveUniversities(),
      courseService.getAvailableCourseDetails(),
    ]);

  if (!announcement) {
    notFound();
  }

  if (
    profile.role === "leader" &&
    announcement.created_by !== profile.id
  ) {
    redirect("/dashboard/admin/announcements");
  }

  async function update(formData: FormData) {
    "use server";

    const result = await updateAnnouncementAction(id, formData);
    if (!result.success) {
      throw new Error(result.message);
    }

    redirect("/dashboard/admin/announcements?feedback=updated");
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Edit Pengumuman"
        description="Ubah isi, target, periode, atau status pengumuman."
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
        defaultValues={announcement}
        allowAllStudents={profile.role === "admin"}
        submitLabel="Simpan Perubahan"
        action={update}
      />
    </main>
  );
}
