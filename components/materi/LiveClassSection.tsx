import type { Database } from "@/supabase/types/database.types";

type LiveClass =
  Database["public"]["Tables"]["live_classes"]["Row"];

interface LiveClassSectionProps {
  liveClasses: LiveClass[];
}

export default function LiveClassSection({
  liveClasses,
}: LiveClassSectionProps) {

  return (
    <section className="mb-10">

      <h2 className="text-2xl font-bold mb-4">
        🎥 Live Class
      </h2>

      {liveClasses.length === 0 ? (

        <div className="rounded-xl border p-6 text-center text-gray-500">
          Belum ada jadwal live class.
        </div>

      ) : (

        <div className="space-y-4">

          {liveClasses.map((liveClass) => (

            <div
              key={liveClass.id}
              className="rounded-xl border p-5"
            >

              <h3 className="font-semibold text-lg">
                {liveClass.title}
              </h3>

              <div className="mt-2 text-sm text-gray-500 space-y-1">

                <p>
                  Tanggal : {liveClass.meeting_date ?? "-"}
                </p>

                <p>
                  Link : {liveClass.meeting_link ?? "-"}
                </p>

                <p>
                  Recording : {liveClass.recording_path ?? "-"}
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}