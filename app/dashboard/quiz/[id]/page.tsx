import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  QuizInfoCard,
  QuizRelationCard,
  QuizActionCard,
} from "@/components/quiz";

import { quizService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuizDetailPage({
  params,
}: Props) {

  const { id } = await params;

  const quiz =
    await quizService.getQuizById(id);

  if (!quiz) {
    notFound();
  }

  return (

    <Container>

      <PageHeader
        title={quiz.title}
        description="Detail Quiz"
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <QuizInfoCard
            quiz={quiz}
          />

          <QuizRelationCard
            lessonId={quiz.lesson_id}
          />

        </div>

        <div>

          <QuizActionCard
            quizId={quiz.id}
          />

        </div>

      </div>

    </Container>

  );

}