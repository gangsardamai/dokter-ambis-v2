import { Lesson } from "@/types";
import LessonItem from "./LessonItem";

interface LessonListProps {
  OrganizationId: string;
  CourseId: string;
  Lessons: Lesson[];
}

export default function LessonList({
  OrganizationId,
  CourseId,
  Lessons,
}: LessonListProps) {
  return (
    <div className="space-y-4">
      {Lessons.map((Lesson) => (
        <LessonItem
          key={Lesson.id}
          OrganizationId={OrganizationId}
          CourseId={CourseId}
          Lesson={Lesson}
        />
      ))}
    </div>
  );
}