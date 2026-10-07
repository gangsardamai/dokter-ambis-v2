"use client";

import Link from "next/link";
import { useState } from "react";

import AnnouncementContent from "@/components/announcements/AnnouncementContent";

import type { Announcement } from "@/repositories/announcement.repository";

interface AnnouncementCarouselProps {
  announcements: Announcement[];
}

export default function AnnouncementCarousel({
  announcements,
}: AnnouncementCarouselProps) {
  const [index, setIndex] = useState(0);

  if (announcements.length === 0) {
    return (
      <aside className="flex min-h-56 flex-col justify-between rounded-[1.6rem] border border-white/30 bg-white p-5 text-slate-900 shadow-lg shadow-blue-950/10">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1769cf]">
            Pengumuman
          </p>
          <h2 className="mt-3 text-xl font-extrabold tracking-[-0.03em]">
            Belum ada pengumuman aktif
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Informasi terbaru akan muncul di kartu ini.
          </p>
        </div>
        <Link
          href="/dashboard/student/announcements"
          className="mt-5 text-sm font-extrabold text-[#1769cf]"
        >
          Buka halaman pengumuman →
        </Link>
      </aside>
    );
  }

  const safeIndex = Math.min(index, announcements.length - 1);
  const announcement = announcements[safeIndex];

  return (
    <aside className="relative flex min-h-48 flex-col rounded-[1.4rem] border border-white/20 bg-white/12 p-4 text-white shadow-lg shadow-blue-950/10 backdrop-blur-md sm:min-h-56 sm:rounded-[1.6rem] sm:p-5">
      <span className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/15 px-2.5 py-1 text-[11px] font-black text-blue-50 backdrop-blur-sm sm:right-5 sm:top-5 sm:px-3 sm:text-xs">
        {safeIndex + 1} / {announcements.length}
      </span>

      <div className="flex-1 pr-12 pt-0.5 sm:pr-14 sm:pt-1">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-blue-100">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_0_3px_rgba(253,230,138,0.14)]" />
          Pengumuman
        </div>
        <h2 className="text-[12.5px] font-extrabold leading-snug tracking-[-0.03em] text-white sm:text-xl">
          {announcement.title}
        </h2>
        <div className="mt-2.5 max-h-[10rem] overflow-hidden text-blue-50/90 [&_*]:text-inherit sm:mt-3 sm:max-h-[9rem]">
          <AnnouncementContent
            content={announcement.content}
            compact
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 sm:mt-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              setIndex((current) =>
                current === 0
                  ? announcements.length - 1
                  : current - 1,
              )
            }
            disabled={announcements.length === 1}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-base font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30 sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg"
            aria-label="Pengumuman sebelumnya"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() =>
              setIndex((current) =>
                current === announcements.length - 1
                  ? 0
                  : current + 1,
              )
            }
            disabled={announcements.length === 1}
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/15 bg-white/10 text-base font-black text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/30 sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg"
            aria-label="Pengumuman berikutnya"
          >
            →
          </button>
        </div>

        <Link
          href={`/dashboard/student/announcements#announcement-${announcement.id}`}
          className="rounded-lg bg-white/10 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-white/20 sm:text-sm"
        >
          Lihat detail
        </Link>
      </div>
    </aside>
  );
}
