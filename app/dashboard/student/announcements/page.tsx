import Link from "next/link";

import { announcementService } from "@/services";

function formatDate(value: string | null): string {
  if (!value) return "Tanpa batas";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function StudentAnnouncementsPage() {
  const announcements =
    await announcementService.getStudentAnnouncementArchive();

  const now = Date.now();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <section className="flex flex-col gap-4 rounded-[2rem] bg-gradient-to-br from-[#1769cf] via-[#0b5ba5] to-[#033b63] p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-100">
            Student
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
            Pengumuman
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
            Semua pengumuman yang ditujukan untuk akun dan course Anda tersimpan di sini.
          </p>
        </div>

        <Link
          href="/dashboard/student"
          className="w-fit rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
        >
          ← Kembali ke Dashboard
        </Link>
      </section>

      {announcements.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-extrabold text-slate-800">
            Belum ada pengumuman
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Pengumuman yang sesuai dengan akun Anda akan muncul di halaman ini.
          </p>
        </section>
      ) : (
        <section className="space-y-4">
          {announcements.map((announcement) => {
            const expired =
              Boolean(announcement.ends_at) &&
              new Date(announcement.ends_at!).getTime() < now;

            return (
              <article
                id={`announcement-${announcement.id}`}
                key={announcement.id}
                className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1769cf]">
                      {expired ? "Arsip Pengumuman" : "Pengumuman Aktif"}
                    </p>
                    <h2 className="mt-2 text-xl font-extrabold tracking-[-0.03em] text-[#061827] sm:text-2xl">
                      {announcement.title}
                    </h2>
                  </div>

                  {expired && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      Masa tayang selesai
                    </span>
                  )}
                </div>

                <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-base">
                  {announcement.content}
                </div>

                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">
                  <span>Mulai: {formatDate(announcement.starts_at)}</span>
                  <span>
                    Berakhir: {formatDate(announcement.ends_at)}
                  </span>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
