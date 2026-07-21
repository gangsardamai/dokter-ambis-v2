import { notFound } from "next/navigation";

import {
  PageTitle,
} from "@/components/admin";

import CourseForm
from "@/components/admin/course/CourseForm";

import {
  courseService,
  organizationService,
  programService,
} from "@/services";

import {
  updateCourseAction,
} from "../../actions";

import {
  mapCourseForm,
} from "@/lib/forms/course";

interface EditCoursePageProps {

  params: Promise<{
    id: string;
  }>;

}

export default async function EditCoursePage({

  params,

}: EditCoursePageProps) {

  const { id } = await params;

  const course =
    await courseService.getCourseById(
      id
    );

  if (!course) {

    notFound();

  }

  const organizations =
    await organizationService.getOrganizations();

  const programs =
    await programService.getPrograms();

  async function updateAction(
    formData: FormData
  ) {

    "use server";

    const result =
      await updateCourseAction(

        id,

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
        title="Edit Course"
        description="Perbarui data course."
      />

      <CourseForm
        defaultValues={course}
        submitLabel="Update Course"
        action={updateAction}
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