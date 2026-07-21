import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  VideoInfoCard,
  VideoRelationCard,
  VideoActionCard,
} from "@/components/video";

import { videoService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function VideoDetailPage({
  params,
}: Props) {

  const { id } = await params;

  const video =
    await videoService.getVideoById(id);

  if (!video) {
    notFound();
  }

  return (

    <Container>

      <PageHeader
        title={video.title}
        description="Detail Video Pembelajaran"
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <VideoInfoCard
            video={video}
          />

          <VideoRelationCard
            lessonId={video.lesson_id}
          />

        </div>

        <div>

          <VideoActionCard
            videoId={video.id}
          />

        </div>

      </div>

    </Container>

  );

}