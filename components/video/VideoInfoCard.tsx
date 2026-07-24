import { Card } from "@/components/ui";
import VideoPlayer from "@/components/video/VideoPlayer";
import VideoProviderBadge from "@/components/video/VideoProviderBadge";
import type { SupportedVideoProvider } from "@/lib/video/video-source";
import type { Database } from "@/supabase/types/database.types";

type Video =
  Database["public"]["Tables"]["videos"]["Row"];

interface VideoInfoCardProps {
  video: Video;
}

export default function VideoInfoCard({
  video,
}: VideoInfoCardProps) {
  const provider =
    video.provider as SupportedVideoProvider;
  const isYoutube = provider === "youtube";

  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold">
          Video Pembelajaran
        </h2>

        <div className="mt-6">
          <VideoPlayer
            provider={provider}
            videoId={video.provider_video_id}
            title={video.title}
          />
        </div>

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
            <div className="mt-2">
              <VideoProviderBadge
                provider={provider}
              />
            </div>
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
