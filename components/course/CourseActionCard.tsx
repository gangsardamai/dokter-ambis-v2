import Link from "next/link";

import { Card } from "@/components/ui";

interface CourseActionCardProps {
  courseId: string;
}

const actionClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black transition focus:outline-none focus:ring-2";

export default function CourseActionCard({
  courseId,
}: CourseActionCardProps) {
  return (
    <Card>
      <div className="p-5 sm:p-6">
        <h2 className="text-lg font-black text-slate-950">
          Manajemen Blok
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Kelola identitas Course, mentor, serta struktur materi pembelajaran.
        </p>

        <div className="mt-6 space-y-3">
          <Link
            href={`/dashboard/admin/course/${courseId}/explorer`}
            className={`${actionClass} bg-gradient-to-r from-blue-600 to-[#064a78] text-white shadow-sm hover:from-blue-700 hover:to-[#053b67] focus:ring-blue-300`}
          >
            Buka Course Explorer
          </Link>

          <Link
            href={`/dashboard/admin/course/${courseId}/mentors`}
            className={`${actionClass} border border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100 focus:ring-blue-200`}
          >
            Atur Mentor
          </Link>

          <Link
            href={`/dashboard/admin/course/${courseId}/edit`}
            className={`${actionClass} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-200`}
          >
            Edit Blok
          </Link>
        </div>
      </div>
    </Card>
  );
}
