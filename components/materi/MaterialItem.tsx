import Link from "next/link";
import { Lesson } from "@/types";

interface LessonItemProps {
  OrganizationId: string;
  CourseId: string;
  Lesson: Lesson;
}

export default function LessonItem({
  OrganizationId,
  CourseId,
  Lesson,
}: LessonItemProps) {
  return (
    <Link
      href={`/universitas/${OrganizationId}/blok/${CourseId}/materi/${Lesson.id}`}
    >
      <div className="border rounded-xl p-5 hover:shadow-lg transition cursor-pointer">

        <div className="flex justify-between items-start">

          <div>

            <h3 className="font-semibold text-lg">
              {Lesson.order}. {Lesson.title}
            </h3>

            <p className="text-gray-500 mt-2">
              {Lesson.description}
            </p>

          </div>

          <div className="text-right text-sm space-y-1">

            {Lesson.hasVideo && <div>🎥 Video</div>}

            {Lesson.hasPdf && <div>📄 PDF</div>}

            {Lesson.hasQuiz && <div>📝 Quiz</div>}

          </div>

        </div>

      </div>
    </Link>
  );
}