import type { Database } from "@/supabase/types/database.types";

import VideoPlayer from "./VideoPlayer";

type Video =
  Database["public"]["Tables"]["videos"]["Row"];

interface VideoCardProps {
  video: Video;
}

export default function VideoCard({
  video,
}: VideoCardProps) {

  return (

    <div className="rounded-xl border bg-white p-6 shadow-sm">

      <h3 className="mb-4 text-lg font-semibold">
        {video.title}
      </h3>

      <VideoPlayer
        provider={video.provider}
        videoId={video.provider_video_id}
      />

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">

        <span>
          ⏱ {video.duration} menit
        </span>

        <span>
          Versi {video.version}
        </span>

      </div>

    </div>

  );

}