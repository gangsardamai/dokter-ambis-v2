import { Card } from "@/components/ui";

import { quizService } from "@/services";

import { QuizList } from "@/components/quiz";

interface LessonQuizCardProps {
  lessonId: string;
}

export default async function LessonQuizCard({
  lessonId,
}: LessonQuizCardProps) {

  const quizzes =
    await quizService.getQuizzesByLesson(
      lessonId
    );

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Quiz
        </h2>

        <div className="mt-6">

          <QuizList
            quizzes={quizzes}
          />

        </div>

      </div>

    </Card>

  );

}