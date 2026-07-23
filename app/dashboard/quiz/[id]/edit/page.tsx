import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  QuizForm,
  QuizRelationCard,
} from "@/components/quiz";

import { updateQuizAction } from "../../actions";

import {
  quizService,
  lessonService,
} from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditQuizPage({
  params,
}: Props) {

  const { id } = await params;

  const quiz =
    await quizService.getQuizById(id);

  if (!quiz) {
    notFound();
  }

  const lessons =
    await lessonService.getLessons();

  return (

    <Container>

      <PageHeader
        title="Edit Quiz"
        description="Perbarui informasi quiz."
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <Card>

            <div className="p-6">

              <QuizForm
                initialData={{
                  lesson_id:
                    quiz.lesson_id,

                  title:
                    quiz.title,

                  duration:
                    quiz.duration,

                  total_questions:
                    quiz.total_questions,

                  passing_score:
                    quiz.passing_score,

                  max_attempt:
                    quiz.max_attempt,

                  quiz_order:
                    quiz.quiz_order,

                  publication_status:
                    quiz.publication_status,

                  is_required:
                    quiz.is_required,

                  shuffle_questions:
                    quiz.shuffle_questions,

                  shuffle_options:
                    quiz.shuffle_options,
                }}
                lessonOptions={lessons.map(
                  (lesson) => ({
                    value: lesson.id,
                    label: lesson.title,
                  })
                )}
                submitLabel="Simpan Perubahan"
                onSubmit={async (data) => {

                  await updateQuizAction(
                    quiz.id,
                    data
                  );

                }}
              />

            </div>

          </Card>

          <QuizRelationCard
            lessonId={quiz.lesson_id}
          />

        </div>

        <div />

      </div>

    </Container>

  );

}