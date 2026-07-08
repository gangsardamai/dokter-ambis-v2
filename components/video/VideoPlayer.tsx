import type { Database } from "@/supabase/types/database.types";

import YoutubePlayer from "./YoutubePlayer";
import BunnyPlayer from "./BunnyPlayer";

type VideoProvider =
  Database["public"]["Enums"]["video_provider"];

interface VideoPlayerProps {
  provider: VideoProvider;
  videoId: string;
}

export default function VideoPlayer({
  provider,
  videoId,
}: VideoPlayerProps) {

  switch (provider) {

    case "youtube":
      return (
        <YoutubePlayer
          videoId={videoId}
        />
      );

    case "bunny":
      return (
        <BunnyPlayer
          videoId={videoId}
        />
      );

    default:
      return (
        <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-600">
          Provider video tidak didukung.
        </div>
      );

  }

}