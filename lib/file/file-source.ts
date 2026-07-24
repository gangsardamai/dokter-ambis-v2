import type { Database } from "@/supabase/types/database.types";

export type CourseFileType =
  Database["public"]["Enums"]["file_type"];

export type FileSourceProvider =
  | "upload"
  | "google_drive";

export interface FileFormPayload {
  lesson_id: string;
  title: string;
  file_type: CourseFileType;
  source_provider: FileSourceProvider;
  file_path: string;
  file_order: number;
  publication_status: string;
  is_required: boolean;
}

const GOOGLE_DRIVE_PATH_PREFIX = "google-drive://";
const GOOGLE_DRIVE_ID_PATTERN = /^[a-zA-Z0-9_-]{10,}$/;

const SUPPORTED_FILE_TYPES = new Set<CourseFileType>([
  "pdf",
  "ppt",
  "pptx",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
  "mp3",
]);

export function isSupportedCourseFileType(
  value: string,
): value is CourseFileType {
  return SUPPORTED_FILE_TYPES.has(
    value as CourseFileType,
  );
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

export function createGoogleDriveFilePath(
  fileId: string,
): string {
  if (!GOOGLE_DRIVE_ID_PATTERN.test(fileId)) {
    throw new Error("Google Drive File ID tidak valid.");
  }

  return `${GOOGLE_DRIVE_PATH_PREFIX}${fileId}`;
}

export function parseGoogleDriveFilePath(
  value: string,
): string | null {
  const input = value.trim();

  if (input.startsWith(GOOGLE_DRIVE_PATH_PREFIX)) {
    const fileId = input.slice(
      GOOGLE_DRIVE_PATH_PREFIX.length,
    );

    return GOOGLE_DRIVE_ID_PATTERN.test(fileId)
      ? fileId
      : null;
  }

  return extractGoogleDriveFileId(input);
}

export function isGoogleDriveFilePath(
  value: string,
): boolean {
  return parseGoogleDriveFilePath(value) !== null;
}

export function getGoogleDriveInputUrl(
  fileId: string,
): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(
    fileId,
  )}/view`;
}

export function getGoogleDriveDownloadUrl(
  fileId: string,
): string {
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(
    fileId,
  )}&export=download&confirm=t`;
}
