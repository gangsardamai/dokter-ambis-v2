import type { Database } from "@/supabase/types/database.types";

import { LiveClassList } from "@/components/live-class";

type LiveClass =
  Database["public"]["Tables"]["live_classes"]["Row"];

interface LiveClassSectionProps {
  liveClasses: LiveClass[];
}

export default function LiveClassSection({
  liveClasses,
}: LiveClassSectionProps) {
  return (
    <section className="mb-10">

      <h2 className="mb-4 text-2xl font-bold">
        💻 Live Class
      </h2>

      <LiveClassList
        liveClasses={liveClasses}
      />

    </section>
  );
}