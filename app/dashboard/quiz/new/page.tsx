import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  QuizForm,
} from "@/components/quiz";

import {
  createQuizAction,
} from "../actions";

import {
  lessonService,
} from "@/services";

export default async function NewQuizPage() {

  const lessons =
    await lessonService.getLessons();

  return (

    <Container>

      <PageHeader
        title="Tambah Quiz"
        description="Tambahkan quiz baru."
      />

      <Card>

        <div className="p-6">

          <QuizForm
            lessonOptions={lessons.map(
              (lesson) => ({
                value: lesson.id,
                label: lesson.title,
              })
            )}
            submitLabel="Simpan"
            onSubmit={async (data) => {

              await createQuizAction(
                data
              );

            }}
          />

        </div>

      </Card>

    </Container>

  );

}