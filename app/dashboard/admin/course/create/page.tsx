import {
  PageTitle,
} from "@/components/admin";

import CourseForm
from "@/components/admin/course/CourseForm";

import {
  organizationService,
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

        submitLabel="Simpan Course"

        action={createAction}

        organizationOptions={
          organizations.map(
            (item) => ({
              label: item.title,
              value: item.id,
            })
          )
        }

        programOptions={
          programs.map(
            (item) => ({
              label: item.title,
              value: item.id,
            })
          )
        }

      />

    </main>

  );

}