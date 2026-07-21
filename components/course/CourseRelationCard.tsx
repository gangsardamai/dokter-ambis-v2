import { Card } from "@/components/ui";

import LessonRelationTable from "@/components/lesson/LessonRelationTable";

interface Props {
  courseId: string;
}

export default function CourseRelationCard({
  courseId,
}: Props) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Materi Dalam Blok
        </h2>

        <div className="mt-6">

          <LessonRelationTable
            courseId={courseId}
          />

        </div>

      </div>

    </Card>

  );

}