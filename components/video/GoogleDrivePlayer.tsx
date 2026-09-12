"use client";

import { useEffect, useState } from "react";

interface GoogleDrivePlayerProps {
  fileId: string;
  title?: string;
}

export default function GoogleDrivePlayer({
  fileId,
  title = "Video pembelajaran",
}: GoogleDrivePlayerProps) {
  const [frameKey, setFrameKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const previewUrl = `https://drive.google.com/file/d/${encodeURIComponent(
    fileId,
  )}/preview`;

  useEffect(() => {
    if (!isReloading) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsReloading(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [frameKey, isReloading]);

  function reloadPlayer() {
    setIsReloading(true);
    setFrameKey((currentKey) => currentKey + 1);
  }

  return (
    <div className="space-y-2">
      <div className="relative aspect-video rounded-xl border border-slate-700 bg-black">
        <iframe
          key={frameKey}
          className="h-full w-full rounded-xl"
          src={previewUrl}
          title={title}
          loading="eager"
          allow="autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsReloading(false)}
        />

        <div
          aria-hidden="true"
          className="pointer-events-auto absolute right-px top-px z-10 grid h-14 w-14 cursor-default select-none place-items-center rounded-bl-2xl rounded-tr-xl bg-slate-950 text-slate-300 shadow-lg"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="10" width="14" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-1 text-xs leading-5 text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Jika player gagal dimuat, coba muat ulang videonya. Progres lesson
          tidak akan terpengaruh.
        </p>

        <button
          type="button"
          onClick={reloadPlayer}
          disabled={isReloading}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 font-bold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-wait disabled:opacity-60"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${isReloading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 11a8.1 8.1 0 1 0 2 5" />
            <path d="M20 4v7h-7" />
          </svg>
          {isReloading ? "Memuat ulang..." : "Muat ulang video"}
        </button>
      </div>
    </div>
  );
}
