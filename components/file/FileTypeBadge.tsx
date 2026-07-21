import type { Database } from "@/supabase/types/database.types";

type FileType =
  Database["public"]["Enums"]["file_type"];

interface FileTypeBadgeProps {
  fileType: FileType;
}

export default function FileTypeBadge({
  fileType,
}: FileTypeBadgeProps) {

  const colorMap: Record<FileType, string> = {
    pdf: "bg-red-100 text-red-700",
    ppt: "bg-orange-100 text-orange-700",
    pptx: "bg-orange-100 text-orange-700",
    doc: "bg-blue-100 text-blue-700",
    docx: "bg-blue-100 text-blue-700",
    xls: "bg-green-100 text-green-700",
    xlsx: "bg-green-100 text-green-700",
    zip: "bg-gray-200 text-gray-700",
    mp3: "bg-purple-100 text-purple-700",
  };

  return (

    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${colorMap[fileType]}`}
    >
      {fileType.toUpperCase()}
    </span>

  );

}