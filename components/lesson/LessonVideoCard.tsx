import { Card } from "@/components/ui";

import { videoService } from "@/services";

import { VideoList } from "@/components/video";

interface LessonVideoCardProps {
  lessonId: string;
}

export default async function LessonVideoCard({
  lessonId,
}: LessonVideoCardProps) {

  const videos =
    await videoService.getVideosByLesson(
      lessonId
    );

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Video Pembelajaran
        </h2>

        <div className="mt-6">

          <VideoList
            videos={videos}
          />

        </div>

      </div>

    </Card>

  );

}