import { Card } from "@/components/ui";

interface QuizRelationCardProps {
  lessonId: string;
}

export default function QuizRelationCard({
  lessonId,
}: QuizRelationCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Relasi Quiz
        </h2>

        <div className="mt-6">

          <p className="text-sm text-gray-500">
            Lesson ID
          </p>

          <p className="mt-1 break-all font-medium">
            {lessonId}
          </p>

        </div>

      </div>

    </Card>

  );

}