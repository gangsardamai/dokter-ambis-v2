import type { Database } from "@/supabase/types/database.types";

import { FileList } from "@/components/file";

type LessonFile =
  Database["public"]["Tables"]["lesson_files"]["Row"];

interface FileSectionProps {
  files: LessonFile[];
}

export default function FileSection({
  files,
}: FileSectionProps) {

  return (

    <section className="mb-10">

      <h2 className="mb-4 text-2xl font-bold">
        📄 Materi
      </h2>

      <FileList
        files={files}
      />

    </section>

  );

}