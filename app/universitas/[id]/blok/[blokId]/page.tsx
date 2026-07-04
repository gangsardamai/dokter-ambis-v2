import { notFound } from "next/navigation";

import { courses } from "@/lib/data/courses";
import { lessons } from "@/lib/data/lessons";

import LessonHeader from "@/components/materi/LessonHeader";
import LessonProgress from "@/components/materi/LessonProgress";
import LessonList from "@/components/materi/LessonList";

interface Props {
  params: Promise<{
    id: string;
    blokId: string;
  }>;
}

export default async function Page({ params }: Props) {
  const { id, blokId } = await params;

  const course = courses.find(
    (c) =>
      c.id === blokId &&
      c.organizationId === id
  );

  if (!course) {
    notFound();
  }

  const courseLessons = lessons
    .filter((lesson) => lesson.courseId === course.id)
    .sort((a, b) => a.order - b.order);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <LessonHeader
        title={course.title}
        description={course.description}
      />

      <LessonProgress progress={35} />

      <LessonList
        organizationId={id}
        courseId={course.id}
        lessons={courseLessons}
      />
    </main>
  );
}