import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  VideoForm,
  VideoRelationCard,
} from "@/components/video";

import { updateVideoAction } from "../../actions";

import {
  videoService,
  lessonService,
} from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditVideoPage({
  params,
}: Props) {

  const { id } = await params;

  const video =
    await videoService.getVideoById(id);

  if (!video) {
    notFound();
  }

  const lessons =
    await lessonService.getLessons();
const updateCurrentVideoAction =
  updateVideoAction.bind(
    null,
    video.id,
  );
  return (

    <Container>

      <PageHeader
        title="Edit Video"
        description="Perbarui informasi video pembelajaran."
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <Card>

            <div className="p-6">

              <VideoForm
                initialData={{
                  lesson_id:
                    video.lesson_id,

                  title:
                    video.title,

                  provider:
                    video.provider,

                  provider_video_id:
                    video.provider_video_id,

                  duration:
                    video.duration,
                }}
                lessonOptions={lessons.map(
                  (lesson) => ({
                    value: lesson.id,
                    label: lesson.title,
                  })
                )}
        submitLabel="Simpan Perubahan"
onSubmit={updateCurrentVideoAction}
              />

            </div>

          </Card>

          <VideoRelationCard
            lessonId={video.lesson_id}
          />

        </div>

        <div />

      </div>

    </Container>

  );

}