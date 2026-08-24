import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  FileForm,
  FileRelationCard,
} from "@/components/file";

import { updateFileAction } from "../../actions";

import {
  lessonFileService,
  lessonService,
} from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditFilePage({
  params,
}: Props) {
  const { id } = await params;

  const file =
    await lessonFileService.getFileById(id);

  if (!file) {
    notFound();
  }

  const lessons =
    await lessonService.getLessons();

  const currentLesson = lessons.find(
    (lesson) => lesson.id === file.lesson_id
  );

  if (!currentLesson) {
    notFound();
  }

  const updateCurrentFileAction =
    updateFileAction.bind(null, file.id);

  return (
    <Container>
      <Link
        href={`/dashboard/admin/course/${currentLesson.course_id}/explorer`}
        className="mb-5 inline-flex items-center text-sm text-blue-600 hover:underline"
      >
        ← Kembali ke Course
      </Link>

      <PageHeader
        title="Edit File"
        description="Perbarui informasi file materi."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="p-6">
              <FileForm
                initialData={{
                  lesson_id: file.lesson_id,
                  title: file.title,
                  file_type: file.file_type,
                  file_path: file.file_path,
                  publication_status:
                    file.publication_status,
                  is_required: file.is_required,
                }}
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
                submitLabel="Simpan Perubahan"
                onSubmit={updateCurrentFileAction}
              />
            </div>
          </Card>

          <FileRelationCard
            lessonId={file.lesson_id}
          />
        </div>

        <div />
      </div>
    </Container>
  );
}
