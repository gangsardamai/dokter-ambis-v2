"use client";

import Link from "next/link";
import { useState } from "react";

import type { Announcement } from "@/repositories/announcement.repository";

interface AnnouncementCarouselProps {
  announcements: Announcement[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
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
    <aside className="flex min-h-56 flex-col rounded-[1.6rem] border border-white/30 bg-white p-5 text-slate-900 shadow-lg shadow-blue-950/10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#1769cf]">
            Pengumuman
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {formatDate(announcement.starts_at)}
          </p>
        </div>

        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1769cf]">
          {safeIndex + 1} / {announcements.length}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <h2 className="text-xl font-extrabold tracking-[-0.03em] text-[#061827]">
          {announcement.title}
        </h2>
        <p className="mt-2 max-h-[4.8rem] overflow-hidden whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {announcement.content}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
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
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-lg font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
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
            className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-lg font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Pengumuman berikutnya"
          >
            →
          </button>
        </div>

        <Link
          href={`/dashboard/student/announcements#announcement-${announcement.id}`}
          className="text-sm font-extrabold text-[#1769cf]"
        >
          Lihat detail
        </Link>
      </div>
    </aside>
  );
}
