import { lessonFileService } from "@/services";

import FileRow from "./FileRow";

export default async function FileTable() {

  const files =
    await lessonFileService.getFiles();

  return (

    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-4 py-3 text-left">
              Judul
            </th>

            <th className="px-4 py-3 text-left">
              Tipe
            </th>

            <th className="px-4 py-3 text-left">
              Version
            </th>

            <th className="px-4 py-3 text-left">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {files.map((file) => (

            <FileRow
              key={file.id}
              file={file}
            />

          ))}

        </tbody>

      </table>

    </div>

  );

}