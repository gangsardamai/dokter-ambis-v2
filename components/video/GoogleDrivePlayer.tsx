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
      <div className="aspect-video rounded-xl border border-slate-700 bg-black">
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
      </div>

      <p className="px-1 text-xs leading-5 text-slate-400">
        Video sedang tidak tersedia dari penyedia apabila player gagal dimuat. Silakan coba kembali beberapa saat lagi.
      </p>
    </div>
  );
}
