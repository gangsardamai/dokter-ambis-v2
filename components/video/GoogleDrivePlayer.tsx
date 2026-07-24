interface GoogleDrivePlayerProps {
  fileId: string;
  title?: string;
}

export default function GoogleDrivePlayer({
  fileId,
  title = "Video pembelajaran",
}: GoogleDrivePlayerProps) {
  return (
    <div className="space-y-2">
      <div className="relative aspect-video rounded-xl border border-slate-700 bg-black">
        <iframe
          className="h-full w-full rounded-xl"
          src={`https://drive.google.com/file/d/${encodeURIComponent(
            fileId,
          )}/preview`}
          title={title}
          loading="lazy"
          allow="autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
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

      <p className="px-1 text-xs leading-5 text-slate-400">
        Video sedang tidak tersedia dari penyedia apabila player gagal dimuat. Silakan coba kembali beberapa saat lagi.
      </p>
    </div>
  );
}
