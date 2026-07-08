import Link from "next/link";

import { Card } from "@/components/ui";

interface CourseActionCardProps {
  courseId: string;
}

export default function CourseActionCard({
  courseId,
}: CourseActionCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Manajemen Blok
        </h2>

        <div className="mt-6">

          <Link
            href={`/dashboard/admin/course/${courseId}/edit`}
            className="block rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition hover:bg-blue-700"
          >
            Edit Blok
          </Link>

        </div>

        <div className="mt-8 border-t pt-6">

          <h3 className="font-semibold text-red-600">
            Danger Zone
          </h3>

          <div className="mt-4">

            <button
              disabled
              className="w-full rounded-lg border border-red-300 px-4 py-2 text-red-600"
            >
              Hapus Blok
            </button>

          </div>

        </div>

      </div>

    </Card>

  );

}