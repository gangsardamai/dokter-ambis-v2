import { programService } from "@/services";
import ProgramRow from "./ProgramRow";

export default async function ProgramTable() {

  const programs =
    await programService.getPrograms();

  if (programs.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
        Belum ada program.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-white">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-6 py-4 text-left">
              Program
            </th>

            <th className="px-6 py-4 text-left">
              Status
            </th>

            <th className="px-6 py-4 text-right">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {programs.map((program) => (

            <ProgramRow
              key={program.id}
              program={program}
            />

          ))}

        </tbody>

      </table>

    </div>
  );
}