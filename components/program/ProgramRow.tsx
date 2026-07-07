import type { Database } from "@/supabase/types/database.types";

import ProgramStatusBadge from "./ProgramStatusBadge";
import ProgramActionMenu from "./ProgramActionMenu";

type Program =
  Database["public"]["Tables"]["programs"]["Row"];

interface ProgramRowProps {
  program: Program;
}

export default function ProgramRow({
  program,
}: ProgramRowProps) {

  return (
    <tr className="border-t">

      <td className="px-6 py-4">

        <div className="font-semibold">
          {program.title}
        </div>

        {program.description && (
          <div className="mt-1 text-sm text-gray-500">
            {program.description}
          </div>
        )}

      </td>

      <td className="px-6 py-4">

        <ProgramStatusBadge
          status={program.status}
        />

      </td>

      <td className="px-6 py-4 text-right">

        <ProgramActionMenu
          programId={program.id}
          status={program.status}
        />

      </td>

    </tr>
  );
}