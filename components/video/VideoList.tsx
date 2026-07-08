import type { Database } from "@/supabase/types/database.types";

import VideoCard from "./VideoCard";

type Video =
  Database["public"]["Tables"]["videos"]["Row"];

interface VideoListProps {
  videos: Video[];
}

export default function VideoList({
  videos,
}: VideoListProps) {

  if (videos.length === 0) {

    return (

      <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">

        Belum ada video pembelajaran.

      </div>

    );

  }

  return (

    <div className="space-y-8">

      {videos.map((video) => (

        <VideoCard
          key={video.id}
          video={video}
        />

      ))}

    </div>

  );

}