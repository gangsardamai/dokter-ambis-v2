import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type Video =
  Database["public"]["Tables"]["videos"]["Row"];

interface VideoInfoCardProps {
  video: Video;
}

export default function VideoInfoCard({
  video,
}: VideoInfoCardProps) {
  const isYoutube =
    video.provider === "youtube";

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold">
          Video Pembelajaran
        </h2>

        {isYoutube ? (
          <div className="mt-6">
            <div className="overflow-hidden rounded-xl bg-black">
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${video.provider_video_id}`}
                  title={video.title}
                  className="h-full w-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            Player untuk provider {video.provider} belum diaktifkan.
          </div>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <p className="text-sm text-gray-500">
              Judul video
            </p>

            <p className="mt-1 font-medium">
              {video.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Provider
            </p>

            <p className="mt-1 font-medium capitalize">
              {video.provider}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Video ID
            </p>

            <p className="mt-1 break-all text-gray-700">
              {video.provider_video_id}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Durasi
            </p>

            <p className="mt-1 font-medium">
              {video.duration} menit
            </p>
          </div>

          {isYoutube && (
            <div>
              <a
                href={`https://www.youtube.com/watch?v=${video.provider_video_id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Buka di YouTube
              </a>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}