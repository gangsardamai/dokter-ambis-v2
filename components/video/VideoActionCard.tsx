import Link from "next/link";

import { Card } from "@/components/ui";

interface VideoActionCardProps {
  videoId: string;
}

export default function VideoActionCard({
  videoId,
}: VideoActionCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Manajemen Video
        </h2>

        <div className="mt-6">

          <Link
            href={`/dashboard/admin/video/${videoId}/edit`}
            className="block rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
          >
            Edit Video
          </Link>

        </div>

        <div className="mt-8 border-t pt-6">

          <h3 className="font-semibold text-red-600">
            Danger Zone
          </h3>

          <button
            disabled
            className="mt-4 w-full rounded-lg border border-red-300 px-4 py-2 text-red-600"
          >
            Hapus Video
          </button>

        </div>

      </div>

    </Card>

  );

}