import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

import FileTypeBadge from "./FileTypeBadge";

type LessonFile =
  Database["public"]["Tables"]["lesson_files"]["Row"];

interface FileRowProps {
  file: LessonFile;
}

export default function FileRow({
  file,
}: FileRowProps) {

  return (

    <tr className="border-b">

      <td className="px-4 py-3">
        {file.title}
      </td>

      <td className="px-4 py-3">

        <FileTypeBadge
          fileType={file.file_type}
        />

      </td>

      <td className="px-4 py-3">

        Version {file.version}

      </td>

      <td className="px-4 py-3">

        <Link
          href={`/dashboard/admin/file/${file.id}`}
          className="text-blue-600 hover:underline"
        >
          Detail
        </Link>

      </td>

    </tr>

  );

}