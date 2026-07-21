import { videoService } from "@/services";

import VideoRow from "./VideoRow";

export default async function VideoTable() {

  const videos =
    await videoService.getVideos();

  return (

    <div className="overflow-x-auto rounded-xl border">

      <table className="min-w-full">

        <thead className="bg-gray-50">

          <tr>

            <th className="px-4 py-3 text-left">
              Judul
            </th>

            <th className="px-4 py-3 text-left">
              Provider
            </th>

            <th className="px-4 py-3 text-left">
              Durasi
            </th>

            <th className="px-4 py-3 text-left">
              Aksi
            </th>

          </tr>

        </thead>

        <tbody>

          {videos.map((video) => (

            <VideoRow
              key={video.id}
              video={video}
            />

          ))}

        </tbody>

      </table>

    </div>

  );

}