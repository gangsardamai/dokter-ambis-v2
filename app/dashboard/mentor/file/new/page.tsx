import {
  Container,
  PageHeader,
} from "@/components/layout";
import { Card } from "@/components/ui";
import { FileForm } from "@/components/file";
import { createFileAction } from "@/app/dashboard/admin/file/actions";
import { lessonService } from "@/services";

export default async function MentorNewFilePage({
  searchParams,
}: {
  searchParams: Promise<{
    lessonId?: string;
    accessMode?: "normal" | "locked";
  }>;
}) {
  const { lessonId, accessMode } = await searchParams;
  const lessons = lessonId
    ? [await lessonService.getLessonById(lessonId)].filter(
        (lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson),
      )
    : await lessonService.getLessons();

  return (
    <Container>
      <PageHeader
        title={accessMode === "locked" ? "Tambah File Locked" : "Tambah File"}
        description={
          accessMode === "locked"
            ? "Tambahkan PDF Google Drive yang hanya dapat dibuka di viewer website."
            : "Tambahkan file materi pada course yang ditugaskan."
        }
      />

      <Card>
        <div className="p-6">
          <FileForm
            initialLessonId={lessonId}
            initialAccessMode={accessMode === "locked" ? "locked" : "normal"}
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
            submitLabel="Simpan"
            onSubmit={createFileAction}
          />
        </div>
      </Card>
    </Container>
  );
}
