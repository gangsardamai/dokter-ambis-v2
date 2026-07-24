import type { SupportedVideoProvider } from "@/lib/video/video-source";

import BunnyPlayer from "./BunnyPlayer";
import GoogleDrivePlayer from "./GoogleDrivePlayer";
import YoutubePlayer from "./YoutubePlayer";

interface VideoPlayerProps {
  provider: SupportedVideoProvider;
  videoId: string;
  title?: string;
}

export default function VideoPlayer({
  provider,
  videoId,
  title,
}: VideoPlayerProps) {
  switch (provider) {
    case "youtube":
      return (
        <YoutubePlayer
          videoId={videoId}
        />
      );

    case "google_drive":
      return (
        <GoogleDrivePlayer
          fileId={videoId}
          title={title}
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
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-sm font-semibold text-amber-800">
          Video sedang tidak tersedia dari penyedia. Silakan coba kembali beberapa saat lagi.
        </div>
      );
  }
}
