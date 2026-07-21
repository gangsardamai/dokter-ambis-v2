import { Card } from "@/components/ui";

interface FileRelationCardProps {
  lessonId: string;
}

export default function FileRelationCard({
  lessonId,
}: FileRelationCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Relasi File
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