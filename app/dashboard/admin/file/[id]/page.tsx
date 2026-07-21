import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  FileInfoCard,
  FileRelationCard,
  FileActionCard,
} from "@/components/file";

import { lessonFileService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function FileDetailPage({
  params,
}: Props) {

  const { id } = await params;

  const file =
    await lessonFileService.getFileById(id);

  if (!file) {
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

          <FileInfoCard
            file={file}
          />

          <FileRelationCard
            lessonId={file.lesson_id}
          />

        </div>

        <div>

          <FileActionCard
            fileId={file.id}
          />

        </div>

      </div>

    </Container>

  );

}