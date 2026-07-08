import type { Database } from "@/supabase/types/database.types";

import LiveClassCard from "./LiveClassCard";

type LiveClass =
  Database["public"]["Tables"]["live_classes"]["Row"];

interface LiveClassListProps {
  liveClasses: LiveClass[];
}

export default function LiveClassList({
  liveClasses,
}: LiveClassListProps) {

  if (liveClasses.length === 0) {

    return (

      <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">

        Belum ada Live Class.

      </div>

    );

  }

  return (

    <div className="space-y-5">

      {liveClasses.map((liveClass) => (

        <LiveClassCard
          key={liveClass.id}
          liveClass={liveClass}
        />

      ))}

    </div>

  );

}