import type { Database } from "@/supabase/types/database.types";

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

      <h2 className="text-2xl font-bold mb-4">
        📄 File Materi
      </h2>

      {files.length === 0 ? (

        <div className="rounded-xl border p-6 text-center text-gray-500">
          Belum ada file materi.
        </div>

      ) : (

        <div className="space-y-4">

          {files.map((file) => (

            <div
              key={file.id}
              className="rounded-xl border p-5"
            >

              <h3 className="font-semibold text-lg">
                {file.title}
              </h3>

              <div className="mt-2 text-sm text-gray-500">

                <p>
                  Jenis File : {file.file_type}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}