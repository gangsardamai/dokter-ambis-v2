import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  LessonInfoCard,
  LessonRelationCard,
  LessonActionCard,
  LessonVideoCard,
  LessonFileCard,
  LessonQuizCard,
  LessonLiveClassCard,
} from "@/components/lesson";

import { lessonService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function LessonDetailPage({
  params,
}: Props) {

  const { id } = await params;

  const lesson =
    await lessonService.getLessonById(id);

  if (!lesson) {
    notFound();
  }

  return (

    <Container>

      <PageHeader
        title={lesson.title}
        description="Detail Materi"
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <LessonInfoCard
            lesson={lesson}
          />

          <LessonRelationCard />

          <LessonVideoCard
            lessonId={lesson.id}
          />

          <LessonFileCard
            lessonId={lesson.id}
          />

          <LessonQuizCard
            lessonId={lesson.id}
          />

          <LessonLiveClassCard
            lessonId={lesson.id}
          />

        </div>

        <div>

          <LessonActionCard
            lessonId={lesson.id}
          />

        </div>

      </div>

    </Container>

  );

}