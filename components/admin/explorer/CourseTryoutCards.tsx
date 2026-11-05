import Link from "next/link";

import type { CourseTryoutCard } from "@/types/tryout";

type ManagerRole = "admin" | "leader" | "mentor";

interface Props {
  tryouts: CourseTryoutCard[];
  managerRole: ManagerRole;
  currentProfileId: string;
}

const statusClass: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-blue-50 text-blue-700",
  closed: "bg-slate-100 text-slate-600",
  draft: "bg-amber-50 text-amber-700",
};

const actionClass =
  "inline-flex min-h-10 items-center justify-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200";

function TryoutIcon() {
  return (
    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-[#033b63] text-white shadow-sm">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export default function CourseTryoutCards({
  tryouts,
  managerRole,
  currentProfileId,
}: Props) {
  const isMentor = managerRole === "mentor";
  const basePath = isMentor ? "/dashboard/mentor/tryout" : "/dashboard/admin/tryout";

  return (
    <section aria-labelledby="course-tryout-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="course-tryout-heading" className="text-lg font-black text-slate-950">
            Try Out
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {tryouts.length} Try Out di course ini. Soal hanya dimuat ketika dibuka.
          </p>
        </div>
        <Link href={`${basePath}/new`} prefetch={false} className={actionClass}>
          + Tambah Try Out
        </Link>
      </div>

      {tryouts.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-blue-200 bg-white p-6 text-center text-sm font-semibold text-slate-500">
          Belum ada Try Out di course ini.
        </p>
      ) : (
        <div className="grid gap-4">
          {tryouts.map((tryout) => {
            // Mentors may see cards created by other managers, but cannot edit them.
            const canManage = !isMentor || tryout.created_by === currentProfileId;
            const duration = tryout.duration_minutes;
            return (
              <article key={tryout.id} className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <TryoutIcon />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-base font-black text-slate-950 sm:text-lg">
                          {tryout.title}
                        </h3>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass[tryout.publication_status] ?? statusClass.draft}`}>
                          {tryout.publication_status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {duration === null || duration === 0 ? "Tanpa batas waktu" : `${duration} menit`}
                        {" · "}Maks. {tryout.max_attempts} percobaan
                      </p>
                      {!canManage && (
                        <p className="mt-2 text-xs text-slate-500">
                          Dibuat pengelola course lain · hanya lihat ringkasan
                        </p>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                      <Link href={`${basePath}/${tryout.id}/edit`} prefetch={false} className={actionClass}>
                        Pengaturan
                      </Link>
                      <Link href={`${basePath}/${tryout.id}/questions`} prefetch={false} className={actionClass}>
                        Kelola Soal
                      </Link>
                      <Link href={`${basePath}/${tryout.id}/results`} prefetch={false} className={actionClass}>
                        Lihat Hasil
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
