import type { Database } from "@/supabase/types/database.types";

type VideoProvider =
  Database["public"]["Enums"]["video_provider"];

interface VideoProviderBadgeProps {
  provider: VideoProvider;
}

export default function VideoProviderBadge({
  provider,
}: VideoProviderBadgeProps) {

  const color =
    provider === "youtube"
      ? "bg-red-100 text-red-700"
      : "bg-green-100 text-green-700";

  const label =
    provider === "youtube"
      ? "YouTube"
      : "Bunny";

  return (

    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${color}`}
    >
      {label}
    </span>

  );

}