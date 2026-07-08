import type { Database } from "@/supabase/types/database.types";

import FileCard from "./FileCard";

type LessonFile =
  Database["public"]["Tables"]["lesson_files"]["Row"];

interface FileListProps {
  files: LessonFile[];
}

export default function FileList({
  files,
}: FileListProps) {

  if (files.length === 0) {

    return (

      <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">

        Belum ada file materi.

      </div>

    );

  }

  return (

    <div className="space-y-4">

      {files.map((file) => (

        <FileCard
          key={file.id}
          file={file}
        />

      ))}

    </div>

  );

}