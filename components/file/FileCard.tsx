import type { Database } from "@/supabase/types/database.types";

type LessonFile =
  Database["public"]["Tables"]["lesson_files"]["Row"];

interface FileCardProps {
  file: LessonFile;
}

export default function FileCard({
  file,
}: FileCardProps) {

  return (

    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <h3 className="font-semibold">
            {file.title}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {file.file_type.toUpperCase()}
          </p>

        </div>

        <a
          href={file.file_path}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Buka
        </a>

      </div>

    </div>

  );

}