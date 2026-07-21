import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

type LiveClass =
  Database["public"]["Tables"]["live_classes"]["Row"];

interface LiveClassRowProps {
  liveClass: LiveClass;
}

export default function LiveClassRow({
  liveClass,
}: LiveClassRowProps) {

  return (

    <tr className="border-b">

      <td className="px-4 py-3">
        {liveClass.title}
      </td>

      <td className="px-4 py-3">
        {new Date(
          liveClass.meeting_date
        ).toLocaleString("id-ID")}
      </td>

      <td className="px-4 py-3">

        <Link
          href={`/dashboard/admin/live-class/${liveClass.id}`}
          className="text-blue-600 hover:underline"
        >
          Detail
        </Link>

      </td>

    </tr>

  );

}