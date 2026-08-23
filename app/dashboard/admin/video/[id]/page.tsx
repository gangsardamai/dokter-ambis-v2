import Link from "next/link";
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

import {
  lessonService,
  videoService,
} from "@/services";

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

  const lesson =
    await lessonService.getLessonById(video.lesson_id);

  if (!lesson) {
    notFound();
  }

  return (
    <Container>
      <div className="mb-5">
        <Link
          href={`/dashboard/admin/course/${lesson.course_id}/explorer`}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          ← Kembali ke Course
        </Link>
      </div>

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
