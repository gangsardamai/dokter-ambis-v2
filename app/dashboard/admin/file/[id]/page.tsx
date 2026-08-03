import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  FileActionCard,
  FileInfoCard,
  FileRelationCard,
} from "@/components/file";

import {
  lessonFileService,
  lessonService,
} from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function FileDetailPage({
  params,
}: Props) {
  const { id } = await params;
  const file = await lessonFileService.getFileById(id);

  if (!file) {
    notFound();
  }

  const lesson = await lessonService.getLessonById(
    file.lesson_id,
  );

  if (!lesson) {
    notFound();
  }

  return (
    <Container>
      <PageHeader
        title={file.title}
        description="Detail File Materi"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FileInfoCard file={file} />
          <FileRelationCard lessonId={file.lesson_id} />
        </div>

        <div>
          <FileActionCard
            fileId={file.id}
            fileTitle={file.title}
            courseId={lesson.course_id}
          />
        </div>
      </div>
    </Container>
  );
}
