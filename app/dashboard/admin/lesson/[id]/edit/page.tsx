import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  LessonForm,
  LessonRelationCard,
} from "@/components/lesson";

import { updateLessonAction } from "../../actions";

import {
  lessonService,
  courseService,
} from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLessonPage({
  params,
}: Props) {

  const { id } = await params;

  const lesson =
    await lessonService.getLessonById(id);

  if (!lesson) {
    notFound();
  }

  const courses =
    await courseService.getCourses();

  return (

    <Container>

      <PageHeader
        title="Edit Materi"
        description="Perbarui informasi materi pembelajaran."
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <Card>

            <div className="p-6">

              <LessonForm
                initialData={{
                  course_id:
                    lesson.course_id,

                  title:
                    lesson.title,

                  slug:
                    lesson.slug,

                  description:
                    lesson.description ?? "",

                  duration:
                    lesson.duration,

                  lesson_order:
                    lesson.lesson_order,

                  is_free:
                    lesson.is_free,
                }}
                courseOptions={courses.map(
                  (course) => ({
                    value: course.id,
                    label: course.title,
                  })
                )}
                submitLabel="Simpan Perubahan"
                onSubmit={async (data) => {

                  await updateLessonAction(
                    lesson.id,
                    data
                  );

                }}
              />

            </div>

          </Card>

          <LessonRelationCard />

        </div>

        <div />

      </div>

    </Container>

  );

}