import type { Database } from "@/supabase/types/database.types";

import {
  FolderNode,
} from ".";

type Folder =
  Database["public"]["Tables"]["lesson_folders"]["Row"];

interface ExplorerTreeProps {
  courseId: string;
  folders: Folder[];
}

export function ExplorerTree({
  courseId,
  folders,
}: ExplorerTreeProps) {
  return (
    <div className="space-y-3">
      {folders.map((folder) => (
        <FolderNode
          key={folder.id}
          courseId={courseId}
          folder={folder}
        />
      ))}
    </div>
  );
}