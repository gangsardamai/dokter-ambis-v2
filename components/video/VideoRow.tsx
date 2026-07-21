import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

import VideoProviderBadge from "./VideoProviderBadge";

type Video =
  Database["public"]["Tables"]["videos"]["Row"];

interface VideoRowProps {
  video: Video;
}

export default function VideoRow({
  video,
}: VideoRowProps) {

  return (

    <tr className="border-b">

      <td className="px-4 py-3">
        {video.title}
      </td>

      <td className="px-4 py-3">
        <VideoProviderBadge
          provider={video.provider}
        />
      </td>

      <td className="px-4 py-3">
        {video.duration} menit
      </td>

      <td className="px-4 py-3">

        <Link
          href={`/dashboard/admin/video/${video.id}`}
          className="text-blue-600 hover:underline"
        >
          Detail
        </Link>

      </td>

    </tr>

  );

}