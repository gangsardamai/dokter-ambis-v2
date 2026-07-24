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
import { updateVideoAction } from "@/app/dashboard/admin/video/actions";
import {
  lessonService,
  videoService,
} from "@/services";

export default async function MentorEditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [video, lessons] = await Promise.all([
    videoService.getVideoById(id),
    lessonService.getLessons(),
  ]);

  if (!video) notFound();

  const updateCurrentVideoAction =
    updateVideoAction.bind(null, video.id);

  return (
    <Container>
      <PageHeader
        title="Edit Video"
        description="Perbarui video pada course yang ditugaskan."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="p-6">
              <VideoForm
                initialData={{
                  lesson_id: video.lesson_id,
                  title: video.title,
                  provider: video.provider,
                  provider_video_id: video.provider_video_id,
                  duration: video.duration,
                  video_order: video.video_order,
                  publication_status: video.publication_status,
                  is_required: video.is_required,
                }}
                lessonOptions={lessons.map((lesson) => ({
                  value: lesson.id,
                  label: lesson.title,
                }))}
                submitLabel="Simpan Perubahan"
                onSubmit={updateCurrentVideoAction}
              />
            </div>
          </Card>

          <VideoRelationCard lessonId={video.lesson_id} />
        </div>

        <div />
      </div>
    </Container>
  );
}
