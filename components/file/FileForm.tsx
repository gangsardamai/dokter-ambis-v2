"use client";

import { useState } from "react";

import {
  SelectField,
  TextInput,
} from "@/components/ui";
import {
  extractGoogleDriveFileId,
  getGoogleDriveInputUrl,
  parseGoogleDriveFilePath,
  type CourseFileType,
  type FileFormPayload,
} from "@/lib/file/file-source";

export type FileType = CourseFileType;

export type FileFormData = Omit<
  FileFormPayload,
  "source_provider"
>;

interface SelectOption {
  value: string;
  label: string;
}

interface FileFormProps {
  initialData?: FileFormData;
  initialLessonId?: string;
  lessonOptions: SelectOption[];
  lessonCourseIds: Record<string, string>;
  submitLabel?: string;
  onSubmit: (
    data: FileFormPayload,
  ) => Promise<void>;
}

export default function FileForm({
  initialData,
  initialLessonId,
  lessonOptions,
  lessonCourseIds,
  submitLabel = "Simpan",
  onSubmit,
}: FileFormProps) {
  const initialGoogleDriveId = initialData
    ? parseGoogleDriveFilePath(initialData.file_path)
    : null;
  const [lessonId, setLessonId] = useState(
    initialData?.lesson_id ?? initialLessonId ?? "",
  );
  const [title, setTitle] = useState(
    initialData?.title ?? "",
  );
  const [fileType, setFileType] =
    useState<FileType>(
      initialData?.file_type ?? "pdf",
    );
  const [googleDriveUrl, setGoogleDriveUrl] =
    useState(
      initialGoogleDriveId
        ? getGoogleDriveInputUrl(initialGoogleDriveId)
        : "",
    );
  const [publicationStatus, setPublicationStatus] =
    useState(
      initialData?.publication_status ?? "draft",
    );
  const [isRequired, setIsRequired] = useState(
    initialData?.is_required ?? true,
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const googleDriveFileId =
    extractGoogleDriveFileId(googleDriveUrl);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (!lessonId || !title.trim()) {
      setErrorMessage(
        "Lesson dan judul file wajib diisi.",
      );
      return;
    }

    if (!lessonCourseIds[lessonId]) {
      setErrorMessage(
        "Course untuk lesson yang dipilih tidak ditemukan.",
      );
      return;
    }

    if (!googleDriveFileId) {
      setErrorMessage(
        "URL Google Drive tidak valid. Gunakan link file drive.google.com, bukan link folder.",
      );
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        lesson_id: lessonId,
        title: title.trim(),
        file_type: fileType,
        source_provider: "google_drive",
        file_path: googleDriveUrl.trim(),
        publication_status: publicationStatus,
        is_required: isRequired,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "File gagal disimpan.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      <SelectField
        label="Lesson"
        value={lessonId}
        options={[
          {
            value: "",
            label: "Pilih Lesson",
          },
          ...lessonOptions,
        ]}
        onChange={setLessonId}
      />

      <TextInput
        label="Judul File"
        value={title}
        required
        onChange={setTitle}
      />

      <SelectField
        label="Sumber File"
        value="google_drive"
        onChange={() => undefined}
        options={[
          {
            value: "google_drive",
            label: "Google Drive",
          },
        ]}
      />

      <SelectField
        label="Tipe File"
        value={fileType}
        onChange={(value) =>
          setFileType(value as FileType)
        }
        options={[
          { value: "pdf", label: "PDF" },
          { value: "ppt", label: "PPT" },
          { value: "pptx", label: "PPTX" },
          { value: "doc", label: "DOC" },
          { value: "docx", label: "DOCX" },
          { value: "xls", label: "XLS" },
          { value: "xlsx", label: "XLSX" },
          { value: "zip", label: "ZIP" },
          { value: "mp3", label: "MP3" },
        ]}
      />

      <div>
        <TextInput
          label="URL File Google Drive"
          required
          value={googleDriveUrl}
          onChange={setGoogleDriveUrl}
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Gunakan link file drive.google.com. Pastikan General access adalah Anyone with the link sebagai Viewer dan opsi download diizinkan. File yang diterima: PDF, PPT/PPTX, DOC/DOCX, XLS/XLSX, ZIP, dan MP3.
        </p>
        {googleDriveUrl && !googleDriveFileId && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            URL Google Drive belum valid atau merupakan link folder.
          </p>
        )}
      </div>

      <SelectField
        label="Status Publikasi"
        value={publicationStatus}
        onChange={setPublicationStatus}
        options={[
          { value: "draft", label: "Draft" },
          {
            value: "published",
            label: "Published",
          },
        ]}
      />

      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
        <input
          type="checkbox"
          checked={isRequired}
          onChange={(event) =>
            setIsRequired(event.target.checked)
          }
          className="h-4 w-4 accent-blue-600"
        />
        File wajib dipelajari
      </label>

      <button
        type="submit"
        disabled={loading || !googleDriveFileId}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
