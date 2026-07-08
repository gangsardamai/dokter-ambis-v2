import type { Database } from "@/supabase/types/database.types";

type LiveClass =
  Database["public"]["Tables"]["live_classes"]["Row"];

interface LiveClassCardProps {
  liveClass: LiveClass;
}

export default function LiveClassCard({
  liveClass,
}: LiveClassCardProps) {

  const meetingDate = new Date(
    liveClass.meeting_date
  ).toLocaleString("id-ID");

  return (

    <div className="rounded-xl border bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>

          <h3 className="text-lg font-semibold">
            {liveClass.title}
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            📅 {meetingDate}
          </p>

        </div>

        {liveClass.meeting_link ? (

          <a
            href={liveClass.meeting_link}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Join
          </a>

        ) : (

          <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500">
            Belum tersedia
          </span>

        )}

      </div>

      {liveClass.recording_path && (

        <div className="mt-5 border-t pt-4">

          <a
            href={liveClass.recording_path}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ▶ Lihat Rekaman
          </a>

        </div>

      )}

    </div>

  );

}