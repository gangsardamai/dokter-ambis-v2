import Link from "next/link";

import {
  EmptyState,
  DeleteProgramButton,
} from "@/components/admin";

import ProgramStatusBadge
  from "./ProgramStatusBadge";

import type { Database }
  from "@/supabase/types/database.types";

type Program =
  Database["public"]["Tables"]["programs"]["Row"];

interface ProgramTableProps {

  programs: Program[];

  onDelete?: (
    id: string
  ) => Promise<void>;

}

export default function ProgramTable({

  programs,

  onDelete,

}: ProgramTableProps) {

  if (programs.length === 0) {

    return (

      <EmptyState
        title="Belum ada Program"
        description="Silakan tambahkan program baru."
      />

    );

  }

  return (

    <div className="overflow-x-auto rounded-lg border">

      <table className="min-w-full">

        <thead className="bg-gray-100">

          <tr>

            <th className="px-4 py-3 text-left">

              Nama

            </th>

            <th className="px-4 py-3 text-left">

              Slug

            </th>

            <th className="px-4 py-3 text-center">

              Status

            </th>

            <th className="px-4 py-3 text-center">

              Aksi

            </th>

          </tr>

        </thead>

        <tbody>

          {

            programs.map(

              (program) => (

                <tr
                  key={program.id}
                  className="border-t"
                >

                  <td className="px-4 py-3">

                    {program.title}

                  </td>

                  <td className="px-4 py-3">

                    {program.slug}

                  </td>

                  <td className="px-4 py-3 text-center">

                    <ProgramStatusBadge
                      status={program.status}
                    />

                  </td>

                  <td className="px-4 py-3">

                    <div className="flex justify-center gap-2">

                      <Link
                        href={`/dashboard/admin/program/${program.id}/edit`}
                        className="rounded bg-blue-600 px-3 py-1 text-white"
                      >

                        Edit

                      </Link>

                      {

                        onDelete && (

                          <DeleteProgramButton
                            id={program.id}
                            onDelete={onDelete}
                          />

                        )

                      }

                    </div>

                  </td>

                </tr>

              )

            )

          }

        </tbody>

      </table>

    </div>

  );

}