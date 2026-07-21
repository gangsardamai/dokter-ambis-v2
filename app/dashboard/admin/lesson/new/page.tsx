import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  Card,
} from "@/components/ui";

import {
  LessonForm,
} from "@/components/lesson";

import {
  createLessonAction,
} from "../actions";

import {
  courseService,
} from "@/services";

export default async function NewLessonPage() {

  const courses =
    await courseService.getCourses();

  return (

    <Container>

      <PageHeader
        title="Tambah Materi"
        description="Buat materi pembelajaran baru."
      />

      <Card>

        <div className="p-6">

          <LessonForm
            courseOptions={courses.map(
              (course) => ({
                value: course.id,
                label: course.title,
              })
            )}
            submitLabel="Simpan"
            onSubmit={async (data) => {

              "use server";

              await createLessonAction(
                data
              );

            }}
          />

        </div>

      </Card>

    </Container>

  );

}