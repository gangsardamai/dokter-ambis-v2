import Link from "next/link";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  lessonService,
  videoService,
} from "@/services";

export default async function AdminVideoPage() {
  const [videos, lessons] =
    await Promise.all([
      videoService.getVideos(),
      lessonService.getLessons(),
    ]);

  const lessonNameMap =
    new Map(
      lessons.map((lesson) => [
        lesson.id,
        lesson.title,
      ]),
    );

  return (
    <Container>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Video Pembelajaran"
          description="Kelola video YouTube yang terhubung dengan materi."
        />

        <Link
          href="/dashboard/admin/video/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Tambah Video
        </Link>
      </div>

      <Card>
        <div className="p-6">
          {videos.length === 0 ? (
            <div className="py-12 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Belum ada video
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Tambahkan video YouTube pertama untuk materi pembelajaran.
              </p>

              <Link
                href="/dashboard/admin/video/new"
                className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tambah Video
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">
                    <th className="px-4 py-3 font-semibold">
                      Judul
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Materi
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Provider
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Durasi
                    </th>

                    <th className="px-4 py-3 text-right font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {videos.map((video) => (
                    <tr
                      key={video.id}
                      className="border-b text-sm last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {video.title}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          ID: {video.provider_video_id}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {lessonNameMap.get(
                          video.lesson_id,
                        ) ?? "Materi tidak ditemukan"}
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                          {video.provider}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {video.duration} menit
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/admin/video/${video.id}`}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Detail
                          </Link>

                          <Link
                            href={`/dashboard/admin/video/${video.id}/edit`}
                            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </Container>
  );
}