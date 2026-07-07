import Link from "next/link";

import { Card } from "@/components/ui";

import ProgramActionButtons from "./ProgramActionButtons";
import type { ProgramStatus } from "./ProgramForm";

interface ProgramActionCardProps {
  programId: string;
  status: ProgramStatus;
}

export default function ProgramActionCard({
  programId,
  status,
}: ProgramActionCardProps) {
  return (
    <Card>
      <div className="p-6">
        <h2 className="text-xl font-semibold">
          Manajemen Program
        </h2>

        <div className="mt-6 space-y-3">
          <Link
            href={`/dashboard/admin/program/${programId}/edit`}
            className="block rounded-lg bg-blue-600 px-4 py-2 text-center font-medium text-white transition hover:bg-blue-700"
          >
            Edit Program
          </Link>
        </div>

        <div className="mt-8 border-t pt-6">
          <h3 className="font-semibold text-red-600">
            Danger Zone
          </h3>

          <div className="mt-4">
            <ProgramActionButtons
              programId={programId}
              status={status}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}