import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import {
  FormCard,
  PageTitle,
  PrimaryButton,
  TextInput,
} from "@/components/admin";
import CourseForm from "@/components/admin/course/CourseForm";
import CourseRegistrationLinkCard from "@/components/admin/course/CourseRegistrationLinkCard";
import { mapCourseForm } from "@/lib/forms/course";
import {
  courseCommunityLinkService,
  courseService,
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
  const course = await courseService.getCourseById(id);

  if (!course) {
    notFound();
  }

  const [
    organizations,
    programs,
    paymentAccounts,
    communityLink,
  ] = await Promise.all([
    organizationService.getOrganizations(),
    programService.getPrograms(),
    paymentAccountService.getActiveAccounts(),
    courseCommunityLinkService.getCourseLink(id),
  ]);

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

      <FormCard>
        <form action={saveWhatsAppGroupAction} className="space-y-5">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              Grup WhatsApp Peserta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Masukkan satu link undangan grup untuk course ini. Kosongkan
              kolom lalu simpan untuk menghapus tombol dari halaman peserta.
            </p>
          </div>

          <TextInput
            label="Link Grup WhatsApp"
            name="whatsapp_group_url"
            defaultValue={communityLink?.whatsapp_group_url ?? ""}
            placeholder="https://chat.whatsapp.com/..."
          />

          <p className="text-xs leading-5 text-slate-500">
            Hanya link dengan domain chat.whatsapp.com yang dapat disimpan.
            Siapa pun yang memperoleh link tersebut dapat membukanya dan
            bergabung sesuai pengaturan grup di WhatsApp.
          </p>

          <PrimaryButton type="submit">
            Simpan Link WhatsApp
          </PrimaryButton>
        </form>
      </FormCard>
    </main>
  );
}
