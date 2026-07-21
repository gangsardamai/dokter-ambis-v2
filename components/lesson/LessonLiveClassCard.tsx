import { Card } from "@/components/ui";

import { liveClassService } from "@/services";

import { LiveClassList } from "@/components/live-class";

interface LessonLiveClassCardProps {
  lessonId: string;
}

export default async function LessonLiveClassCard({
  lessonId,
}: LessonLiveClassCardProps) {

  const liveClasses =
    await liveClassService.getLiveClassesByLesson(
      lessonId
    );

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Live Class
        </h2>

        <div className="mt-6">

          <LiveClassList
            liveClasses={liveClasses}
          />

        </div>

      </div>

    </Card>

  );

}