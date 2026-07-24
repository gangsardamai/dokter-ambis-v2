import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  VideoForm,
} from "@/components/video";

import {
  createVideoAction,
} from "../actions";

import {
  lessonService,
} from "@/services";

export default async function NewVideoPage({
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
        title="Tambah Video"
        description="Tambahkan video pembelajaran baru."
      />

      <Card>

        <div className="p-6">

          <VideoForm
  initialLessonId={lessonId}
  lessonOptions={lessons.map(
    (lesson) => ({
      value: lesson.id,
      label: lesson.title,
    }),
  )}
  submitLabel="Simpan"
  onSubmit={createVideoAction}
/>

        </div>

      </Card>

    </Container>

  );

}