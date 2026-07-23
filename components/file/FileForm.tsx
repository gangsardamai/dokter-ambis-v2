"use client";

import { useState } from "react";

import {
  SelectField,
  TextInput,
} from "@/components/ui";

import { createClient } from "@/lib/supabase/client";

import type { Database } from "@/supabase/types/database.types";

export type FileType =
  Database["public"]["Enums"]["file_type"];

export type FileFormData = {
  lesson_id: string;
  title: string;
  file_type: FileType;
  file_path: string;
  file_order: number;
  publication_status: string;
  is_required: boolean;
};

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
    data: FileFormData,
  ) => Promise<void>;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export default function FileForm({
  initialData,
  initialLessonId,
  lessonOptions,
  lessonCourseIds,
  submitLabel = "Simpan",
  onSubmit,
}: FileFormProps) {
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
  const [filePath, setFilePath] = useState(
    initialData?.file_path ?? "",
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

    if (fileOrder < 1) {
      setErrorMessage("Urutan file minimal 1.");
      return;
    }

    let nextFilePath = filePath;
    let uploadedObjectPath: string | null = null;

    setLoading(true);

    try {
      if (selectedFile) {
        const courseId = lessonCourseIds[lessonId];

        if (!courseId) {
          throw new Error(
            "Course untuk lesson yang dipilih tidak ditemukan.",
          );
        }

        const safeName =
          sanitizeFileName(selectedFile.name) ||
          "materi";
        const objectPath =
          `${courseId}/${lessonId}/${crypto.randomUUID()}-${safeName}`;
        const supabase = createClient();

        const { error: uploadError } =
          await supabase.storage
            .from("course-materials")
            .upload(objectPath, selectedFile, {
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        nextFilePath = objectPath;
        uploadedObjectPath = objectPath;
      }

      if (!nextFilePath) {
        throw new Error(
          "Pilih file materi yang akan diunggah.",
        );
      }

      await onSubmit({
        lesson_id: lessonId,
        title: title.trim(),
        file_type: fileType,
        file_path: nextFilePath,
        file_order: fileOrder,
        publication_status: publicationStatus,
        is_required: isRequired,
      });

      setFilePath(nextFilePath);
    } catch (error) {
      if (uploadedObjectPath) {
        const supabase = createClient();
        await supabase.storage
          .from("course-materials")
          .remove([uploadedObjectPath]);
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

      <label className="block">
        <span className="text-sm font-bold text-slate-700">
          Upload File
        </span>
        <input
          type="file"
          onChange={(event) =>
            setSelectedFile(
              event.target.files?.[0] ?? null,
            )
          }
          className="mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Maksimal 50 MB. File disimpan pada storage privat dan hanya dapat diunduh oleh admin, mentor yang ditugaskan, atau peserta dengan enrollment aktif.
        </p>
        {filePath && !selectedFile && (
          <p className="mt-2 text-xs font-bold text-emerald-700">
            File tersimpan saat ini tetap digunakan.
          </p>
        )}
      </label>

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
        disabled={loading}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Menyimpan..." : submitLabel}
      </button>
    </form>
  );
}
