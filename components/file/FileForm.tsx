"use client";

import { useState } from "react";

import {
  SelectField,
  TextInput,
} from "@/components/ui";
import {
  extractGoogleDriveFileId,
  extractGoogleSheetsFileId,
  getGoogleDriveInputUrl,
  getGoogleSheetsInputUrl,
  parseGoogleDriveFilePath,
  parseGoogleSheetsFilePath,
  type CourseFileType,
  type FileFormPayload,
  type FileSourceProvider,
} from "@/lib/file/file-source";

export type FileType = CourseFileType;
type SelectableSourceProvider = Exclude<
  FileSourceProvider,
  "upload"
>;

export type FileFormData = Omit<
  FileFormPayload,
  "source_provider"
>;

interface FileSubmitResult {
  error?: string;
}

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
  ) => Promise<FileSubmitResult | undefined>;
}

export default function FileForm({
  initialData,
  initialLessonId,
  lessonOptions,
  lessonCourseIds,
  submitLabel = "Simpan",
  onSubmit,
}: FileFormProps) {
  const initialGoogleSheetsId = initialData
    ? parseGoogleSheetsFilePath(initialData.file_path)
    : null;
  const initialGoogleDriveId = initialData
    ? parseGoogleDriveFilePath(initialData.file_path)
    : null;
  const initialSourceProvider: SelectableSourceProvider =
    initialGoogleSheetsId
      ? "google_sheets"
      : "google_drive";
  const initialSourceUrl = initialGoogleSheetsId
    ? getGoogleSheetsInputUrl(initialGoogleSheetsId)
    : initialGoogleDriveId
      ? getGoogleDriveInputUrl(initialGoogleDriveId)
      : "";

  const [lessonId, setLessonId] = useState(
    initialData?.lesson_id ?? initialLessonId ?? "",
  );
  const [title, setTitle] = useState(
    initialData?.title ?? "",
  );
  const [fileType, setFileType] =
    useState<FileType>(
      initialGoogleSheetsId
        ? "xlsx"
        : initialData?.file_type ?? "pdf",
    );
  const [sourceProvider, setSourceProvider] =
    useState<SelectableSourceProvider>(
      initialSourceProvider,
    );
  const [sourceUrl, setSourceUrl] =
    useState(initialSourceUrl);
  const [publicationStatus, setPublicationStatus] =
    useState(
      initialData?.publication_status ?? "draft",
    );
  const [isRequired, setIsRequired] = useState(
    initialData?.is_required ?? true,
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const sourceFileId =
    sourceProvider === "google_sheets"
      ? extractGoogleSheetsFileId(sourceUrl)
      : extractGoogleDriveFileId(sourceUrl);

  const isGoogleSheets =
    sourceProvider === "google_sheets";

  function handleSourceProviderChange(value: string) {
    const nextProvider =
      value as SelectableSourceProvider;

    setSourceProvider(nextProvider);
    setSourceUrl("");
    setErrorMessage("");

    if (nextProvider === "google_sheets") {
      setFileType("xlsx");
    }
  }

  function handleSourceUrlChange(value: string) {
    setSourceUrl(value);
    setErrorMessage("");

    if (extractGoogleSheetsFileId(value)) {
      setSourceProvider("google_sheets");
      setFileType("xlsx");
      return;
    }

    if (extractGoogleDriveFileId(value)) {
      setSourceProvider("google_drive");
    }
  }

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

    if (!sourceFileId) {
      setErrorMessage(
        isGoogleSheets
          ? "URL Google Spreadsheet tidak valid. Gunakan link docs.google.com/spreadsheets."
          : "URL Google Drive tidak valid. Gunakan link file drive.google.com, bukan link folder.",
      );
      return;
    }

    setLoading(true);

    try {
      const result = await onSubmit({
        lesson_id: lessonId,
        title: title.trim(),
        file_type: isGoogleSheets ? "xlsx" : fileType,
        source_provider: sourceProvider,
        file_path: sourceUrl.trim(),
        publication_status: publicationStatus,
        is_required: isRequired,
      });

      if (result?.error) {
        setErrorMessage(result.error);
      }
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
        value={sourceProvider}
        onChange={handleSourceProviderChange}
        options={[
          {
            value: "google_drive",
            label: "Google Drive",
          },
          {
            value: "google_sheets",
            label: "Google Spreadsheet (Sheets)",
          },
        ]}
      />

      <SelectField
        label="Tipe File"
        value={isGoogleSheets ? "xlsx" : fileType}
        onChange={(value) =>
          setFileType(value as FileType)
        }
        options={
          isGoogleSheets
            ? [
                {
                  value: "xlsx",
                  label: "Google Spreadsheet (XLSX)",
                },
              ]
            : [
                { value: "pdf", label: "PDF" },
                { value: "ppt", label: "PPT" },
                { value: "pptx", label: "PPTX" },
                { value: "doc", label: "DOC" },
                { value: "docx", label: "DOCX" },
                { value: "xls", label: "XLS" },
                { value: "xlsx", label: "XLSX" },
                { value: "zip", label: "ZIP" },
                { value: "mp3", label: "MP3" },
              ]
        }
      />

      <div>
        <TextInput
          label={
            isGoogleSheets
              ? "URL Google Spreadsheet"
              : "URL File Google Drive"
          }
          required
          value={sourceUrl}
          onChange={handleSourceUrlChange}
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          {isGoogleSheets
            ? "Tempel link Google Sheets dari docs.google.com/spreadsheets. Pastikan General access adalah Anyone with the link sebagai Viewer. Peserta akan membuka spreadsheet di tab baru tanpa dipaksa mengunduh file."
            : "Gunakan link file drive.google.com. Pastikan General access adalah Anyone with the link sebagai Viewer dan opsi download diizinkan. File yang diterima: PDF, PPT/PPTX, DOC/DOCX, XLS/XLSX, ZIP, dan MP3."}
        </p>
        {sourceUrl && !sourceFileId && (
          <p className="mt-2 text-sm font-semibold text-red-600">
            {isGoogleSheets
              ? "URL Google Spreadsheet belum valid. Gunakan link docs.google.com/spreadsheets."
              : "URL Google Drive belum valid atau merupakan link folder."}
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
        disabled={loading || !sourceFileId}
        aria-busy={loading}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="mr-2 h-4 w-4 animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="3"
                className="opacity-90"
              />
            </svg>
            Menyimpan...
          </>
        ) : (
          submitLabel
        )}
      </button>
    </form>
  );
}
