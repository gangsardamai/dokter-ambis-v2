import CourseContentAccordion from "@/components/course-explorer/CourseContentAccordion";

import type { Database } from "@/supabase/types/database.types";
import type { CourseExplorerContent } from "@/types/course-explorer";

import {
  ExplorerHeader,
  ExplorerToolbar,
} from ".";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

interface ExplorerPageProps {
  course: Course;
  content: CourseExplorerContent;
  managerRole?: "admin" | "mentor";
}

export function ExplorerPage({
  course,
  content,
  managerRole = "admin",
}: ExplorerPageProps) {
  const folderCount = content.folders.length;
  const lessonCount =
    content.ungroupedLessons.length +
    content.folders.reduce(
      (total, folder) => total + folder.lessons.length,
      0,
    );

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <ExplorerHeader
        course={course}
        folderCount={folderCount}
        lessonCount={lessonCount}
      />

      <ExplorerToolbar
        courseId={course.id}
        managerRole={managerRole}
      />

      <CourseContentAccordion
        courseId={course.id}
        content={content}
        mode="manager"
        managerRole={managerRole}
      />
    </main>
  );
}
