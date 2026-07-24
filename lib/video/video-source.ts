import type { Database } from "@/supabase/types/database.types";

export type DatabaseVideoProvider =
  Database["public"]["Enums"]["video_provider"];

export type SupportedVideoProvider =
  | DatabaseVideoProvider
  | "google_drive";

export interface VideoFormPayload {
  lesson_id: string;
  title: string;
  provider: SupportedVideoProvider;
  provider_video_id: string;
  duration: number;
  video_order: number;
  publication_status: string;
  is_required: boolean;
}

export interface NormalizedVideoSource {
  provider: SupportedVideoProvider;
  providerVideoId: string;
}

const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const GOOGLE_DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

export function extractYoutubeVideoId(
  value: string,
): string | null {
  const input = value.trim();

  if (!input) {
    return null;
  }

  if (YOUTUBE_ID_PATTERN.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    const hostname = url.hostname
      .replace(/^www\./, "")
      .toLowerCase();

    if (hostname === "youtu.be") {
      const id = url.pathname
        .split("/")
        .filter(Boolean)[0];

      return id && YOUTUBE_ID_PATTERN.test(id)
        ? id
        : null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      const watchId = url.searchParams.get("v");

      if (
        watchId &&
        YOUTUBE_ID_PATTERN.test(watchId)
      ) {
        return watchId;
      }

      const pathParts = url.pathname
        .split("/")
        .filter(Boolean);

      if (
        pathParts[0] === "embed" ||
        pathParts[0] === "shorts" ||
        pathParts[0] === "live"
      ) {
        const id = pathParts[1];

        return id && YOUTUBE_ID_PATTERN.test(id)
          ? id
          : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function extractGoogleDriveFileId(
  value: string,
): string | null {
  const input = value.trim();

  if (!input) {
    return null;
  }

  try {
    const url = new URL(input);
    const hostname = url.hostname
      .replace(/^www\./, "")
      .toLowerCase();

    if (
      url.protocol !== "https:" ||
      hostname !== "drive.google.com"
    ) {
      return null;
    }

    const pathParts = url.pathname
      .split("/")
      .filter(Boolean);

    if (
      pathParts[0] === "file" &&
      pathParts[1] === "d"
    ) {
      const fileId = pathParts[2];

      return fileId &&
        GOOGLE_DRIVE_ID_PATTERN.test(fileId)
        ? fileId
        : null;
    }

    if (
      pathParts[0] === "open" ||
      pathParts[0] === "uc"
    ) {
      const fileId = url.searchParams.get("id");

      return fileId &&
        GOOGLE_DRIVE_ID_PATTERN.test(fileId)
        ? fileId
        : null;
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeVideoSource(
  provider: SupportedVideoProvider,
  value: string,
): NormalizedVideoSource {
  const input = value.trim();

  if (provider === "youtube") {
    const videoId = extractYoutubeVideoId(input);

    if (!videoId) {
      throw new Error(
        "URL YouTube tidak valid. Gunakan URL youtube.com atau youtu.be.",
      );
    }

    return {
      provider,
      providerVideoId: videoId,
    };
  }

  if (provider === "google_drive") {
    const fileId = extractGoogleDriveFileId(input);

    if (!fileId) {
      throw new Error(
        "URL Google Drive tidak valid. Gunakan URL file drive.google.com/file/d/FILE_ID/view atau /preview.",
      );
    }

    return {
      provider,
      providerVideoId: fileId,
    };
  }

  if (!input) {
    throw new Error("Video ID wajib diisi.");
  }

  return {
    provider,
    providerVideoId: input,
  };
}

export function getVideoSourceInput(
  provider: SupportedVideoProvider,
  providerVideoId: string,
): string {
  if (!providerVideoId) {
    return "";
  }

  if (provider === "youtube") {
    return `https://www.youtube.com/watch?v=${providerVideoId}`;
  }

  if (provider === "google_drive") {
    return `https://drive.google.com/file/d/${providerVideoId}/view`;
  }

  return providerVideoId;
}

export function getVideoInputLabel(
  provider: SupportedVideoProvider,
): string {
  if (provider === "google_drive") {
    return "URL Google Drive";
  }

  if (provider === "youtube") {
    return "URL YouTube";
  }

  return "Video ID";
}

export function getVideoInputHelp(
  provider: SupportedVideoProvider,
): string {
  if (provider === "google_drive") {
    return "Contoh: https://drive.google.com/file/d/FILE_ID/view atau /preview. Pastikan akses file adalah Anyone with the link sebagai Viewer.";
  }

  if (provider === "youtube") {
    return "Contoh: https://www.youtube.com/watch?v=xxxxxxxxxxx atau https://youtu.be/xxxxxxxxxxx";
  }

  return "Masukkan ID video dari provider yang dipilih.";
}
