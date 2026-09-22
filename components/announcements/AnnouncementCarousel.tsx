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
    <aside className="relative flex min-h-48 flex-col rounded-[1.4rem] border border-white/30 bg-white p-4 text-slate-900 shadow-lg shadow-blue-950/10 sm:min-h-56 sm:rounded-[1.6rem] sm:p-5">
      <span className="absolute right-4 top-4 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-[#1769cf] sm:right-5 sm:top-5 sm:px-3 sm:text-xs">
        {safeIndex + 1} / {announcements.length}
      </span>

      <div className="flex-1 pr-12 pt-0.5 sm:pr-14 sm:pt-1">
        <h2 className="text-[10px] font-extrabold leading-snug tracking-[-0.03em] text-[#061827] sm:text-xl">
          {announcement.title}
        </h2>
        <div className="mt-2.5 max-h-[7.5rem] overflow-hidden sm:mt-3 sm:max-h-[9rem]">
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
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-slate-100 text-base font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white disabled:text-slate-300 sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg"
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
            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-300 bg-slate-100 text-base font-black text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-white disabled:text-slate-300 sm:h-9 sm:w-9 sm:rounded-xl sm:text-lg"
            aria-label="Pengumuman berikutnya"
          >
            →
          </button>
        </div>

        <Link
          href={`/dashboard/student/announcements#announcement-${announcement.id}`}
          className="text-xs font-extrabold text-[#1769cf] transition hover:text-[#0b5ba5] sm:text-sm"
        >
          Lihat detail
        </Link>
      </div>
    </aside>
  );
}
