import type { SupportedVideoProvider } from "@/lib/video/video-source";

interface VideoProviderBadgeProps {
  provider: SupportedVideoProvider;
}

export default function VideoProviderBadge({
  provider,
}: VideoProviderBadgeProps) {
  const styles: Record<
    SupportedVideoProvider,
    { label: string; className: string }
  > = {
    youtube: {
      label: "YouTube",
      className: "bg-red-100 text-red-700",
    },
    google_drive: {
      label: "Google Drive",
      className: "bg-blue-100 text-blue-700",
    },
    bunny: {
      label: "Bunny",
      className: "bg-green-100 text-green-700",
    },
    upload: {
      label: "Upload",
      className: "bg-slate-100 text-slate-700",
    },
  };
  const style = styles[provider];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${style.className}`}
    >
      {style.label}
    </span>
  );
}
