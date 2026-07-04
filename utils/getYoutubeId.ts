export function getYoutubeId(url: string) {
  const regex =
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;

  return url.match(regex)?.[1] ?? "";
}