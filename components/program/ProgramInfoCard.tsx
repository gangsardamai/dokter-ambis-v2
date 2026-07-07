import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type Program =
  Database["public"]["Tables"]["programs"]["Row"];

interface ProgramInfoCardProps {
  program: Program;
}

export default function ProgramInfoCard({
  program,
}: ProgramInfoCardProps) {
  return (
    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Informasi Program
        </h2>

        <div className="mt-6 space-y-6">

          <div>
            <p className="text-sm text-gray-500">
              Nama Program
            </p>

            <p className="mt-1 font-medium">
              {program.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Slug
            </p>

            <p className="mt-1 font-medium">
              {program.slug}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <span
              className={
                program.status === "active"
                  ? "inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                  : "inline-flex rounded-full bg-gray-200 px-3 py-1 text-sm font-medium text-gray-700"
              }
            >
              {program.status}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Deskripsi
            </p>

            <p className="mt-1 leading-7 text-gray-700">
              {program.description ||
                "Belum ada deskripsi."}
            </p>
          </div>

        </div>

      </div>

    </Card>
  );
}