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

export async function deleteStoredCourseFile(
  filePath: string,
  lesson: LessonLocation,
): Promise<void> {
  const normalizedPath = filePath.trim();

  if (!normalizedPath || isGoogleDriveFilePath(normalizedPath)) {
    return;
  }

  const folderSegment = lesson.folder_id ?? "ungrouped";
  const r2Prefix = [
    "courses",
    lesson.course_id,
    "folders",
    folderSegment,
    "lessons",
    lesson.id,
    "",
  ].join("/");
  const supabasePrefix = [
    lesson.course_id,
    "folders",
    folderSegment,
    "lessons",
    lesson.id,
    "",
  ].join("/");
  const parsedR2Path = parseR2FilePath(normalizedPath);

  if (parsedR2Path) {
    if (
      !isR2Configured() ||
      parsedR2Path.bucket !== getR2BucketName() ||
      !parsedR2Path.key.startsWith(r2Prefix)
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

  if (!normalizedPath.startsWith(supabasePrefix)) {
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
