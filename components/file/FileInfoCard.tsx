import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type LessonFile =
  Database["public"]["Tables"]["lesson_files"]["Row"];

interface FileInfoCardProps {
  file: LessonFile;
}

export default function FileInfoCard({
  file,
}: FileInfoCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Informasi File
        </h2>

        <div className="mt-6 space-y-6">

          <div>

            <p className="text-sm text-gray-500">
              Judul
            </p>

            <p className="mt-1 font-medium">
              {file.title}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Tipe File
            </p>

            <p className="mt-1 font-medium">
              {file.file_type.toUpperCase()}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              File Path
            </p>

            <p className="mt-1 break-all text-gray-700">
              {file.file_path}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Version
            </p>

            <p className="mt-1 font-medium">
              {file.version}
            </p>

          </div>

        </div>

      </div>

    </Card>

  );

}