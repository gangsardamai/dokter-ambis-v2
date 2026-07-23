import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  FileForm,
} from "@/components/file";

import {
  createFileAction,
} from "../actions";

import {
  lessonService,
} from "@/services";

export default async function NewFilePage({
  searchParams,
}: {
  searchParams: Promise<{
    lessonId?: string;
  }>;
}) {
  const { lessonId } = await searchParams;

  const lessons =
    await lessonService.getLessons();

  return (

    <Container>

      <PageHeader
        title="Tambah File"
        description="Tambahkan file materi baru."
      />

      <Card>

        <div className="p-6">

          <FileForm
            initialLessonId={lessonId}
            lessonCourseIds={Object.fromEntries(
              lessons.map((lesson) => [
                lesson.id,
                lesson.course_id,
              ]),
            )}
            lessonOptions={lessons.map(
              (lesson) => ({
                value: lesson.id,
                label: lesson.title,
              })
            )}
            submitLabel="Simpan"
            onSubmit={createFileAction}
          />

        </div>

      </Card>

    </Container>

  );
}
