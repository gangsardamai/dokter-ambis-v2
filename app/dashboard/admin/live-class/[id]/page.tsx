import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import LiveClassInfoCard
  from "@/components/live-class/LiveClassInfoCard";

import LiveClassRelationCard
  from "@/components/live-class/LiveClassRelationCard";

import LiveClassActionCard
  from "@/components/live-class/LiveClassActionCard";

import { liveClassService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function LiveClassDetailPage({
  params,
}: Props) {

  const { id } = await params;

  const liveClass =
    await liveClassService.getLiveClassById(
      id
    );

  if (!liveClass) {
    notFound();
  }

  return (

    <Container>

      <PageHeader
        title={liveClass.title}
        description="Detail Live Class"
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <LiveClassInfoCard
            liveClass={liveClass}
          />

          <LiveClassRelationCard
            lessonId={liveClass.lesson_id}
          />

        </div>

        <div>

          <LiveClassActionCard
            liveClassId={liveClass.id}
          />

        </div>

      </div>

    </Container>

  );

}