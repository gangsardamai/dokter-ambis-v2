import {
  PageTitle,
} from "@/components/admin";

import CourseForm
from "@/components/admin/course/CourseForm";

import {
  organizationService,
  paymentAccountService,
  programService,
} from "@/services";

import {
  createCourseAction,
} from "../actions";

import {
  mapCourseForm,
} from "@/lib/forms/course";

export default async function CreateCoursePage() {

  const organizations =
    await organizationService.getOrganizations();

  const programs =
    await programService.getPrograms();

  const paymentAccounts =
    await paymentAccountService.getActiveAccounts();

  async function createAction(
    formData: FormData
  ) {

    "use server";

    const result =
      await createCourseAction(

        mapCourseForm(
          formData
        )

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