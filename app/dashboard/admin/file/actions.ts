"use server";

import { revalidatePath } from "next/cache";

import {
  createGoogleDriveFilePath,
  createGoogleSheetsFilePath,
  extractGoogleDriveFileId,
  extractGoogleSheetsFileId,
  isSupportedCourseFileType,
  type FileFormPayload,
} from "@/lib/file/file-source";
import { lessonFileService } from "@/services";
import type { Database } from "@/supabase/types/database.types";

type LessonFileInsert =
  Database["public"]["Tables"]["lesson_files"]["Insert"];

type LessonFileUpdate =
  Database["public"]["Tables"]["lesson_files"]["Update"];

type NormalizedFileData = Omit<
  LessonFileInsert,
  "file_order"
>;

export interface FileActionResult {
  error?: string;
}

const VALIDATION_MESSAGES = new Set([
  "Lesson dan judul file wajib diisi.",
  "Tipe file tidak diizinkan.",
  "Status publikasi tidak valid.",
  "URL Google Drive tidak valid. Gunakan URL file drive.google.com, bukan URL folder.",
  "URL Google Spreadsheet tidak valid. Gunakan URL docs.google.com/spreadsheets.",
  "Upload file sedang dinonaktifkan. Gunakan file dari Google Drive atau Google Spreadsheet.",
  "Sumber file tidak valid.",
]);

function getFileActionError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (VALIDATION_MESSAGES.has(message)) {
    return message;
  }

  if (
    message.includes("uq_lesson_files_lesson_path") ||
    message.includes("23505")
  ) {
    return "Materi ini sudah terhubung pada lesson tersebut.";
  }

  console.error("File action failed:", error);
  return "File gagal disimpan. Silakan coba lagi.";
}

function normalizeFilePayload(
  data: FileFormPayload,
): NormalizedFileData {
  const lessonId = data.lesson_id.trim();
  const title = data.title.trim();

  if (!lessonId || !title) {
    throw new Error(
      "Lesson dan judul file wajib diisi.",
    );
  }

  if (!isSupportedCourseFileType(data.file_type)) {
    throw new Error("Tipe file tidak diizinkan.");
  }

  if (
    data.publication_status !== "draft" &&
    data.publication_status !== "published"
  ) {
    throw new Error("Status publikasi tidak valid.");
  }

  let normalizedFilePath: string;

  if (data.source_provider === "google_drive") {
    const fileId = extractGoogleDriveFileId(
      data.file_path,
    );

    if (!fileId) {
      throw new Error(
        "URL Google Drive tidak valid. Gunakan URL file drive.google.com, bukan URL folder.",
      );
    }

    normalizedFilePath =
      createGoogleDriveFilePath(fileId);
  } else if (
    data.source_provider === "google_sheets"
  ) {
    const fileId = extractGoogleSheetsFileId(
      data.file_path,
    );

    if (!fileId) {
      throw new Error(
        "URL Google Spreadsheet tidak valid. Gunakan URL docs.google.com/spreadsheets.",
      );
    }

    normalizedFilePath =
      createGoogleSheetsFilePath(fileId);
  } else if (data.source_provider === "upload") {
    throw new Error(
      "Upload file sedang dinonaktifkan. Gunakan file dari Google Drive atau Google Spreadsheet.",
    );
  } else {
    throw new Error("Sumber file tidak valid.");
  }

  return {
    lesson_id: lessonId,
    title,
    file_type: data.file_type,
    file_path: normalizedFilePath,
    publication_status: data.publication_status,
    is_required: data.is_required,
  };
}

export async function createFileAction(
  data: FileFormPayload,
): Promise<FileActionResult> {
  try {
    await lessonFileService.createFile(
      normalizeFilePayload(data),
    );

    revalidatePath("/dashboard/admin/file");
    revalidatePath("/dashboard/mentor");
    return {};
  } catch (error) {
    return { error: getFileActionError(error) };
  }
}

export async function updateFileAction(
  id: string,
  data: FileFormPayload,
): Promise<FileActionResult> {
  try {
    const normalized = normalizeFilePayload(data);
    const updateData: LessonFileUpdate = {
      lesson_id: normalized.lesson_id,
      title: normalized.title,
      file_type: normalized.file_type,
      file_path: normalized.file_path,
      publication_status:
        normalized.publication_status,
      is_required: normalized.is_required,
    };

    await lessonFileService.updateFile(
      id,
      updateData,
    );

    revalidatePath("/dashboard/admin/file");
    revalidatePath(`/dashboard/admin/file/${id}`);
    revalidatePath("/dashboard/mentor");
    return {};
  } catch (error) {
    return { error: getFileActionError(error) };
  }
}

export async function deleteFileAction(
  id: string,
) {
  await lessonFileService.deleteFile(id);

  revalidatePath("/dashboard/admin/file");
  revalidatePath("/dashboard/mentor");
}
