import { Card } from "@/components/ui";

import { lessonFileService } from "@/services";

import { FileList } from "@/components/file";

interface LessonFileCardProps {
  lessonId: string;
}

export default async function LessonFileCard({
  lessonId,
}: LessonFileCardProps) {

  const files =
    await lessonFileService.getFilesByLesson(
      lessonId
    );

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          File Materi
        </h2>

        <div className="mt-6">

          <FileList
            files={files}
          />

        </div>

      </div>

    </Card>

  );

}