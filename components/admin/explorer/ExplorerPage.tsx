import type { Database } from "@/supabase/types/database.types";

import {
  EmptyExplorer,
  ExplorerHeader,
  ExplorerToolbar,
  ExplorerTree,
} from ".";

type Course =
  Database["public"]["Tables"]["courses"]["Row"];

type Folder =
  Database["public"]["Tables"]["lesson_folders"]["Row"];

interface ExplorerPageProps {
  course: Course;
  folders: Folder[];
  lessonCount: number;
}

export function ExplorerPage({
  course,
  folders,
  lessonCount,
}: ExplorerPageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden p-4 sm:p-6 lg:p-8">
      <ExplorerHeader
        course={course}
        folderCount={folders.length}
        lessonCount={lessonCount}
      />

      <ExplorerToolbar
        courseId={course.id}
      />

      {folders.length === 0 ? (
        <EmptyExplorer
          createFolderHref={`/dashboard/admin/course/${course.id}/explorer/folder/create`}
        />
      ) : (
        <ExplorerTree
          courseId={course.id}
          folders={folders}
        />
      )}
    </main>
  );
}
