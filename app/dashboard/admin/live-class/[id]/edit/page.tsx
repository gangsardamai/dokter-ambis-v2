import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import LiveClassForm
  from "@/components/live-class/LiveClassForm";

import LiveClassRelationCard
  from "@/components/live-class/LiveClassRelationCard";

import {
  updateLiveClassAction,
} from "../../actions";

import {
  lessonService,
  liveClassService,
} from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLiveClassPage({
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

  const lessons =
    await lessonService.getLessons();

  return (

    <Container>

      <PageHeader
        title="Edit Live Class"
        description="Perbarui informasi Live Class."
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <Card>

            <div className="p-6">

              <LiveClassForm
                initialData={{
                  lesson_id:
                    liveClass.lesson_id,

                  title:
                    liveClass.title,

                  meeting_date:
                    liveClass.meeting_date,

                  meeting_link:
                    liveClass.meeting_link ?? "",

                  recording_path:
                    liveClass.recording_path ?? "",
                }}
                lessonOptions={lessons.map(
                  (lesson) => ({
                    value: lesson.id,
                    label: lesson.title,
                  })
                )}
                submitLabel="Simpan Perubahan"
                onSubmit={async (data) => {

                  await updateLiveClassAction(
                    liveClass.id,
                    data
                  );

                }}
              />

            </div>

          </Card>

          <LiveClassRelationCard
            lessonId={liveClass.lesson_id}
          />

        </div>

        <div />

      </div>

    </Container>

  );

}