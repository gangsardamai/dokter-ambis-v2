import type { Database } from "@/supabase/types/database.types";

type Video =
  Database["public"]["Tables"]["videos"]["Row"];

interface VideoSectionProps {
  videos: Video[];
}

export default function VideoSection({
  videos,
}: VideoSectionProps) {

  return (
    <section className="mb-10">

      <h2 className="text-2xl font-bold mb-4">
        🎥 Video Pembelajaran
      </h2>

      {videos.length === 0 ? (

        <div className="rounded-xl border p-6 text-center text-gray-500">
          Belum ada video pembelajaran.
        </div>

      ) : (

        <div className="space-y-4">

          {videos.map((video) => (

            <div
              key={video.id}
              className="rounded-xl border p-5"
            >

              <h3 className="font-semibold text-lg">
                {video.title}
              </h3>

              <div className="mt-2 text-sm text-gray-500">

                <p>
                  Provider : {video.provider}
                </p>

                <p>
                  Durasi : {video.duration} menit
                </p>

              </div>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}