import "server-only";

import {
  createR2PresignedUrl,
  getR2BucketName,
  isR2Configured,
  parseR2FilePath,
} from "@/lib/cloudflare/r2";
import { isGoogleDriveFilePath } from "@/lib/file/file-source";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/supabase/types/database.types";

type LessonLocation = Pick<
  Database["public"]["Tables"]["lessons"]["Row"],
  "id" | "course_id" | "folder_id"
>;

const MATERIAL_BUCKET = "course-materials";

function isExpectedR2ObjectKey(
  objectKey: string,
  lesson: LessonLocation,
): boolean {
  const segments = objectKey.split("/");

  return (
    segments.length >= 7 &&
    segments[0] === "courses" &&
    segments[1] === lesson.course_id &&
    segments[2] === "folders" &&
    Boolean(segments[3]) &&
    segments[4] === "lessons" &&
    segments[5] === lesson.id &&
    Boolean(segments[6])
  );
}

function isExpectedSupabaseObjectPath(
  objectPath: string,
  lesson: LessonLocation,
): boolean {
  const segments = objectPath.split("/");

  return (
    segments.length >= 6 &&
    segments[0] === lesson.course_id &&
    segments[1] === "folders" &&
    Boolean(segments[2]) &&
    segments[3] === "lessons" &&
    segments[4] === lesson.id &&
    Boolean(segments[5])
  );
}

export async function deleteStoredCourseFile(
  filePath: string,
  lesson: LessonLocation,
): Promise<void> {
  const normalizedPath = filePath.trim();

  if (!normalizedPath || isGoogleDriveFilePath(normalizedPath)) {
    return;
  }

  const parsedR2Path = parseR2FilePath(normalizedPath);

  if (parsedR2Path) {
    if (
      !isR2Configured() ||
      parsedR2Path.bucket !== getR2BucketName() ||
      !isExpectedR2ObjectKey(parsedR2Path.key, lesson)
    ) {
      throw new Error(
        "Path file Cloudflare R2 tidak valid atau konfigurasi R2 tidak tersedia.",
      );
    }

    const signed = createR2PresignedUrl({
      method: "DELETE",
      key: parsedR2Path.key,
      expiresIn: 120,
    });
    const response = await fetch(signed.url, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!response.ok && response.status !== 404) {
      throw new Error("File Cloudflare R2 gagal dihapus.");
    }

    return;
  }

  if (!isExpectedSupabaseObjectPath(normalizedPath, lesson)) {
    throw new Error(
      "Path file tidak sesuai dengan lesson yang dipilih.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(MATERIAL_BUCKET)
    .remove([normalizedPath]);

  if (error) {
    throw new Error(
      `File Supabase Storage gagal dihapus: ${error.message}`,
    );
  }
}
