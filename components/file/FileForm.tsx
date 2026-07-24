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
  type FileSourceProvider,
} from "@/lib/file/file-source";
import { createClient } from "@/lib/supabase/client";

export type FileType = CourseFileType;

export type FileFormData = Omit<
  FileFormPayload,
  "source_provider"
>;

interface SelectOption {
  value: string;
  label: string;
}

interface StorageUploadResponse {
  provider: "r2" | "supabase";
  bucket?: string;
  uploadUrl?: string;
  headers?: Record<string, string>;
  objectPath: string;
  filePath: string;
  message?: string;
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
  const initialSourceProvider: FileSourceProvider =
    initialGoogleDriveId
      ? "google_drive"
      : "upload";

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
  const [sourceProvider, setSourceProvider] =
    useState<FileSourceProvider>(
      initialSourceProvider,
    );
  const [filePath, setFilePath] = useState(
    initialSourceProvider === "upload"
      ? initialData?.file_path ?? ""
      : "",
  );
  const [googleDriveUrl, setGoogleDriveUrl] =
    useState(
      initialGoogleDriveId
        ? getGoogleDriveInputUrl(initialGoogleDriveId)
        : "",
    );
  const [fileOrder, setFileOrder] = useState(
    initialData?.file_order ?? 1,
  );
  const [publicationStatus, setPublicationStatus] =
    useState(
      initialData?.publication_status ?? "draft",
    );
  const [isRequired, setIsRequired] = useState(
    initialData?.is_required ?? true,
  );
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const googleDriveFileId =
    extractGoogleDriveFileId(googleDriveUrl);

  function handleSourceProviderChange(
    value: string,
  ) {
    setSourceProvider(value as FileSourceProvider);
    setSelectedFile(null);
    setErrorMessage("");
  }

  async function requestStorageUpload(
    file: File,
  ): Promise<StorageUploadResponse> {
    const response = await fetch("/api/uploads/r2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        lessonId,
        fileName: file.name,
        fileSize: file.size,
        contentType:
          file.type || "application/octet-stream",
      }),
    });
    const payload =
      (await response.json()) as StorageUploadResponse;

    if (!response.ok) {
      throw new Error(
        payload.message ||
          "Lokasi upload materi gagal dibuat.",
      );
    }

    return payload;
  }

  async function uploadSelectedFile(
    file: File,
    upload: StorageUploadResponse,
  ): Promise<void> {
    if (upload.provider === "r2") {
      if (!upload.uploadUrl) {
        throw new Error(
          "URL upload Cloudflare R2 tidak tersedia.",
        );
      }

      const uploadResponse = await fetch(
        upload.uploadUrl,
        {
          method: "PUT",
          headers: upload.headers ?? {},
          body: file,
        },
      );

      if (!uploadResponse.ok) {
        throw new Error(
          `Upload Cloudflare R2 gagal (${uploadResponse.status}).`,
        );
      }

      return;
    }

    const supabase = createClient();
    const { error: uploadError } =
      await supabase.storage
        .from(upload.bucket ?? "course-materials")
        .upload(upload.objectPath, file, {
          cacheControl: "3600",
          contentType:
            file.type || "application/octet-stream",
          upsert: false,
        });

    if (uploadError) {
      throw new Error(uploadError.message);
    }
  }

  async function cleanupUpload(
    uploadedFilePath: string,
  ): Promise<void> {
    try {
      await fetch("/api/uploads/r2", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
          filePath: uploadedFilePath,
        }),
      });
    } catch {
      // Cleanup is best-effort. The form error remains primary.
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

    if (
      !Number.isInteger(fileOrder) ||
      fileOrder < 1
    ) {
      setErrorMessage(
        "Urutan file harus berupa bilangan bulat minimal 1.",
      );
      return;
    }

    if (
      sourceProvider === "google_drive" &&
      !googleDriveFileId
    ) {
      setErrorMessage(
        "URL Google Drive tidak valid. Gunakan link file drive.google.com, bukan link folder.",
      );
      return;
    }

    let nextFilePath =
      sourceProvider === "google_drive"
        ? googleDriveUrl.trim()
        : filePath;
    let uploadedFilePath: string | null = null;

    setLoading(true);

    try {
      if (
        sourceProvider === "upload" &&
        selectedFile
      ) {
        const upload =
          await requestStorageUpload(selectedFile);
        await uploadSelectedFile(selectedFile, upload);
        nextFilePath = upload.filePath;
        uploadedFilePath = upload.filePath;
      }

      if (!nextFilePath) {
        throw new Error(
          sourceProvider === "google_drive"
            ? "Masukkan URL file Google Drive."
            : "Pilih file materi yang akan diunggah.",
        );
      }

      await onSubmit({
        lesson_id: lessonId,
        title: title.trim(),
        file_type: fileType,
        source_provider: sourceProvider,
        file_path: nextFilePath,
        file_order: fileOrder,
        publication_status: publicationStatus,
        is_required: isRequired,
      });

      if (sourceProvider === "upload") {
        setFilePath(nextFilePath);
        setSelectedFile(null);
      }
    } catch (error) {
      if (uploadedFilePath) {
        await cleanupUpload(uploadedFilePath);
      }

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
            value: "upload",
            label: "Upload File",
          },
          {
            value: "google_drive",
            label: "Google Drive",
          },
        ]}
      />

      <div className="grid gap-5 sm:grid-cols-2">
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

        <TextInput
          label="Urutan File"
          type="number"
          value={String(fileOrder)}
          onChange={(value) =>
            setFileOrder(Number(value))
          }
        />
      </div>

      {sourceProvider === "upload" ? (
        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            Upload File
          </span>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.zip,.mp3"
            onChange={(event) =>
              setSelectedFile(
                event.target.files?.[0] ?? null,
              )
            }
            className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Maksimal 50 MB. Sistem memakai Cloudflare R2 saat tersedia dan otomatis kembali ke Supabase Storage selama R2 belum dikonfigurasi.
          </p>
          {filePath && !selectedFile && (
            <p className="mt-2 text-xs font-bold text-emerald-700">
              File upload yang tersimpan saat ini tetap digunakan.
            </p>
          )}
        </label>
      ) : (
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
      )}

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
        disabled={
          loading ||
          (sourceProvider === "google_drive" &&
            !googleDriveFileId)
        }
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading
          ? sourceProvider === "upload"
            ? "Mengunggah..."
            : "Menyimpan..."
          : submitLabel}
      </button>
    </form>
  );
}
