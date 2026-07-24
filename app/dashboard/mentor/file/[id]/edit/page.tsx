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
import { updateFileAction } from "@/app/dashboard/admin/file/actions";
import {
  lessonFileService,
  lessonService,
} from "@/services";

export default async function MentorEditFilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [file, lessons] = await Promise.all([
    lessonFileService.getFileById(id),
    lessonService.getLessons(),
  ]);

  if (!file) notFound();

  const updateCurrentFileAction =
    updateFileAction.bind(null, file.id);

  return (
    <Container>
      <PageHeader
        title="Edit File"
        description="Perbarui file materi pada course yang ditugaskan."
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
                  file_order: file.file_order,
                  publication_status: file.publication_status,
                  is_required: file.is_required,
                }}
                lessonCourseIds={Object.fromEntries(
                  lessons.map((lesson) => [
                    lesson.id,
                    lesson.course_id,
                  ]),
                )}
                lessonOptions={lessons.map((lesson) => ({
                  value: lesson.id,
                  label: lesson.title,
                }))}
                submitLabel="Simpan Perubahan"
                onSubmit={updateCurrentFileAction}
              />
            </div>
          </Card>

          <FileRelationCard lessonId={file.lesson_id} />
        </div>

        <div />
      </div>
    </Container>
  );
}
