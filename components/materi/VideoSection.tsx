import type { Database } from "@/supabase/types/database.types";

import { VideoList } from "@/components/video";

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

      <h2 className="mb-4 text-2xl font-bold">
        🎥 Video Pembelajaran
      </h2>

      <VideoList
        videos={videos}
      />

    </section>
  );
}