import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import LiveClassForm from "@/components/live-class/LiveClassForm";

import {
  createLiveClassAction,
} from "../actions";

import {
  lessonService,
} from "@/services";

export default async function NewLiveClassPage() {

  const lessons =
    await lessonService.getLessons();

  return (

    <Container>

      <PageHeader
        title="Tambah Live Class"
        description="Tambahkan jadwal live class baru."
      />

      <Card>

        <div className="p-6">

          <LiveClassForm
            lessonOptions={lessons.map(
              (lesson) => ({
                value: lesson.id,
                label: lesson.title,
              })
            )}
            submitLabel="Simpan"
            onSubmit={async (data) => {

              await createLiveClassAction(
                data
              );

            }}
          />

        </div>

      </Card>

    </Container>

  );

}