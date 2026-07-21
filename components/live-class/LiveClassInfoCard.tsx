import { Card } from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

type LiveClass =
  Database["public"]["Tables"]["live_classes"]["Row"];

interface LiveClassInfoCardProps {
  liveClass: LiveClass;
}

export default function LiveClassInfoCard({
  liveClass,
}: LiveClassInfoCardProps) {

  return (

    <Card>

      <div className="p-6">

        <h2 className="text-xl font-semibold">
          Informasi Live Class
        </h2>

        <div className="mt-6 space-y-6">

          <div>

            <p className="text-sm text-gray-500">
              Judul
            </p>

            <p className="mt-1 font-medium">
              {liveClass.title}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Meeting
            </p>

            <p className="mt-1">
              {new Date(
                liveClass.meeting_date
              ).toLocaleString("id-ID")}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Meeting Link
            </p>

            <p className="mt-1 break-all">
              {liveClass.meeting_link ??
                "-"}
            </p>

          </div>

          <div>

            <p className="text-sm text-gray-500">
              Recording
            </p>

            <p className="mt-1 break-all">
              {liveClass.recording_path ??
                "-"}
            </p>

          </div>

        </div>

      </div>

    </Card>

  );

}