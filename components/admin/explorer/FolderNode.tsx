import type { Database } from "@/supabase/types/database.types";

import {
  lessonService,
} from "@/services";

import {
  FolderMenu,
  LessonNode,
} from ".";

type Folder =
  Database["public"]["Tables"]["lesson_folders"]["Row"];

interface FolderNodeProps {
  courseId: string;
  folder: Folder;
}

export async function FolderNode({
  courseId,
  folder,
}: FolderNodeProps) {

  const lessons =
    await lessonService.getLessonsByFolder(
      folder.id,
    );

  return (

    <div className="space-y-2">

      <div
        className="
          flex
          items-center
          justify-between
          rounded-lg
          border
          bg-white
          px-4
          py-4
          shadow-sm
        "
      >

        <div className="flex items-center gap-3">

          <span className="text-xl">
            📂
          </span>

          <div>

            <p className="font-medium">
              {folder.title}
            </p>

            {folder.description && (
              <p className="text-sm text-gray-500">
                {folder.description}
              </p>
            )}

          </div>

        </div>

        <FolderMenu
          courseId={courseId}
          folderId={folder.id}
        />

      </div>

      {lessons.length > 0 && (

        <div className="space-y-2">

          {lessons.map((lesson) => (

            <LessonNode
              key={lesson.id}
              courseId={courseId}
              lesson={lesson}
            />

          ))}

        </div>

      )}

    </div>

  );

}