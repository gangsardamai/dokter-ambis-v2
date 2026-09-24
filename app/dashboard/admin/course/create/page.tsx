import {
  PageTitle,
} from "@/components/admin";

import CourseForm
from "@/components/admin/course/CourseForm";

import {
  leaderAccessService,
  organizationService,
  paymentAccountService,
  programService,
} from "@/services";

import {
  createCourseAction,
  generateCourseRegistrationLinkAction,
} from "../actions";

import {
  mapCourseForm,
} from "@/lib/forms/course";

export default async function CreateCoursePage() {

  const [allOrganizations, allPrograms, paymentAccounts] = await Promise.all([
    organizationService.getOrganizations(), programService.getPrograms(), paymentAccountService.getActiveAccounts(),
  ]);
  const programs = await leaderAccessService.getAssignablePrograms(allPrograms);
  const organizationIds = new Set(programs.map(program => program.organization_id));
  const organizations = allOrganizations.filter(item => organizationIds.has(item.id));

  async function createAction(
    formData: FormData
  ) {

    "use server";

    const result =
      await createCourseAction(
        mapCourseForm(formData),
        String(formData.get("whatsapp_group_url") ?? ""),
        String(formData.get("registration_slug") ?? ""),
      );

    if (!result.success) {

      throw new Error(
        result.message
      );

    }

  }

  return (

    <main className="max-w-3xl mx-auto p-8">

      <PageTitle
        title="Tambah Course"
        description="Tambahkan course baru."
      />

      <CourseForm

        defaultValues={{
          payment_account_id:
            paymentAccounts.find((item) => item.is_default)?.id ??
            paymentAccounts[0]?.id ??
            "",
        }}

        submitLabel="Simpan Course"

        action={createAction}
        showCreationSetup
        generateRegistrationLink={generateCourseRegistrationLinkAction}

        organizationOptions={
          organizations.map(
            (item) => ({
              label: item.is_general ? `${item.title} (Umum)` : item.title,
              value: item.id,
            })
          )
        }

        programOptions={
          programs.map(
            (item) => ({
              label: item.title,
              value: item.id,
              organizationId: item.organization_id,
            })
          )
        }
        paymentAccountOptions={
          paymentAccounts.map((item) => ({
            label: `${item.label} — ${item.bank_name}`,
            value: item.id,
          }))
        }

      />

    </main>

  );

}