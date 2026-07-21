import Link from "next/link";

import { Card } from "@/components/ui";

interface LiveClassActionCardProps {
  liveClassId: string;
}

export default function LiveClassActionCard({
  liveClassId,
}: LiveClassActionCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Manajemen Live Class
        </h2>

        <div className="mt-6">

          <Link
            href={`/dashboard/admin/live-class/${liveClassId}/edit`}
            className="block rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition hover:bg-blue-700"
          >
            Edit Live Class
          </Link>

        </div>

        <div className="mt-8 border-t pt-6">

          <h3 className="font-semibold text-red-600">
            Danger Zone
          </h3>

          <div className="mt-4">

            <button
              type="button"
              disabled
              className="w-full rounded-lg border border-red-300 px-4 py-2 text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Hapus Live Class
            </button>

          </div>

        </div>

      </div>

    </Card>

  );

}