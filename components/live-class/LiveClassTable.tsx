import { liveClassService } from "@/services";

import LiveClassRow from "./LiveClassRow";

export default async function LiveClassTable() {

  const liveClasses =
    await liveClassService.getLiveClasses();

  return (

    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-4 py-3 text-left">
              Judul
            </th>

            <th className="px-4 py-3 text-left">
              Meeting
            </th>

            <th className="px-4 py-3 text-left">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {liveClasses.map((item) => (

            <LiveClassRow
              key={item.id}
              liveClass={item}
            />

          ))}

        </tbody>

      </table>

    </div>

  );

}