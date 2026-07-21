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
}

export function ExplorerPage({
  course,
  folders,
}: ExplorerPageProps) {
  return (
    <div className="space-y-6">

      <ExplorerHeader
        course={course}
        folderCount={folders.length}
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

    </div>
  );
}