import { Card } from "@/components/ui";

interface VideoRelationCardProps {
  lessonId: string;
}

export default function VideoRelationCard({
  lessonId,
}: VideoRelationCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Relasi Video
        </h2>

        <div className="mt-6 space-y-4">

          <div>

            <p className="text-sm text-gray-500">
              Lesson ID
            </p>

            <p className="mt-1 break-all font-medium">
              {lessonId}
            </p>

          </div>

        </div>

      </div>

    </Card>

  );

}