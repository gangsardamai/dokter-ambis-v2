import Link from "next/link";

import { Card } from "@/components/ui";

interface FileActionCardProps {
  fileId: string;
}

export default function FileActionCard({
  fileId,
}: FileActionCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Manajemen File
        </h2>

        <div className="mt-6">

          <Link
            href={`/dashboard/admin/file/${fileId}/edit`}
            className="block rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white hover:bg-blue-700"
          >
            Edit File
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
            Hapus File
          </button>

        </div>

      </div>

    </Card>

  );

}