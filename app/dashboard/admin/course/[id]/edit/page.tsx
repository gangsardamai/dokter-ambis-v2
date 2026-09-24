import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import {
  FormCard,
  PageTitle,
} from "@/components/admin";
import CourseForm from "@/components/admin/course/CourseForm";
import CourseRegistrationLinkCard from "@/components/admin/course/CourseRegistrationLinkCard";
import CourseWhatsAppGroupForm from "@/components/admin/course/CourseWhatsAppGroupForm";
import { mapCourseForm } from "@/lib/forms/course";
import {
  courseCommunityLinkService,
  courseService,
  leaderAccessService,
  profileService,
  organizationService,
  paymentAccountService,
  programService,
} from "@/services";

import { updateCourseAction } from "../../actions";

interface EditCoursePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCoursePage({
  params,
}: EditCoursePageProps) {
  const { id } = await params;
  const profile = await profileService.getCurrentProfile();
  const course = await courseService.getCourseById(id);

  if (!course) {
    notFound();
  }

  const [
    allOrganizations,
    allPrograms,
    paymentAccounts,
    communityLink,
  ] = await Promise.all([
    organizationService.getOrganizations(),
    programService.getPrograms(),
    paymentAccountService.getActiveAccounts(),
    profile && ["admin", "leader"].includes(profile.role)
      ? courseCommunityLinkService.getCourseLink(id)
      : Promise.resolve(null),
  ]);

  const assignedPrograms = await leaderAccessService.getAssignablePrograms(allPrograms);
  const programs = allPrograms.filter(item => item.id === course.program_id || assignedPrograms.some(assigned => assigned.id === item.id));
  const organizations = allOrganizations.filter(item => item.id === course.organization_id || programs.some(program => program.organization_id === item.id));

  const courseOrganization = organizations.find(
    (organization) => organization.id === course.organization_id,
  );
  const registrationPath = courseOrganization
    ? `/daftar/${courseOrganization.slug}/${course.slug}`
    : `/kelas/${course.id}`;
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://dokterambis.com"
  ).replace(/\/+$/, "");
  const registrationUrl = `${siteUrl}${registrationPath}`;

  async function updateAction(formData: FormData) {
    "use server";

    const result = await updateCourseAction(id, mapCourseForm(formData));

    if (!result.success) {
      throw new Error(result.message);
    }
  }

  async function saveWhatsAppGroupAction(formData: FormData) {
    "use server";

    const currentProfile = await profileService.getCurrentProfile();

    if (
      !currentProfile ||
      currentProfile.status !== "active" ||
      !["admin", "leader"].includes(currentProfile.role)
    ) {
      throw new Error("Akses pengelola Course diperlukan.");
    }

    const whatsappGroupUrl = String(
      formData.get("whatsapp_group_url") ?? "",
    );

    await courseCommunityLinkService.saveWhatsAppGroupUrl(
      id,
      whatsappGroupUrl,
    );

    revalidatePath(`/dashboard/admin/course/${id}/edit`);
    revalidatePath(`/dashboard/student/my-course/${id}`);
  }

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <PageTitle
        title="Edit Course"
        description="Perbarui data course."
      />

      <CourseForm
        defaultValues={course}
        submitLabel="Update Course"
        action={updateAction}
        organizationOptions={organizations.map((item) => ({
          label: item.is_general ? `${item.title} (Umum)` : item.title,
          value: item.id,
        }))}
        programOptions={programs.map((item) => ({
          label: item.title,
          value: item.id,
          organizationId: item.organization_id,
        }))}
        paymentAccountOptions={paymentAccounts.map((item) => ({
          label: `${item.label} — ${item.bank_name}`,
          value: item.id,
        }))}
      />

      <FormCard>
        <CourseRegistrationLinkCard
          registrationUrl={registrationUrl}
        />
      </FormCard>

      {profile && ["admin", "leader"].includes(profile.role) && <FormCard>
        <CourseWhatsAppGroupForm
          defaultValue={communityLink?.whatsapp_group_url ?? ""}
          action={saveWhatsAppGroupAction}
        />
      </FormCard>}
    </main>
  );
}
