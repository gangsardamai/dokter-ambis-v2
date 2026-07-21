"use client";

import { useState } from "react";

import {
  TextInput,
  SelectField,
} from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

export type FileType =
  Database["public"]["Enums"]["file_type"];

export type FileFormData = {
  lesson_id: string;
  title: string;
  file_type: FileType;
  file_path: string;
};

interface SelectOption {
  value: string;
  label: string;
}

interface FileFormProps {
  initialData?: FileFormData;

  lessonOptions: SelectOption[];

  submitLabel?: string;

  onSubmit: (
    data: FileFormData
  ) => Promise<void>;
}

export default function FileForm({
  initialData,
  lessonOptions,
  submitLabel = "Simpan",
  onSubmit,
}: FileFormProps) {

  const [lessonId, setLessonId] =
    useState(
      initialData?.lesson_id ?? ""
    );

  const [title, setTitle] =
    useState(
      initialData?.title ?? ""
    );

  const [fileType, setFileType] =
    useState<FileType>(
      initialData?.file_type ?? "pdf"
    );

  const [filePath, setFilePath] =
    useState(
      initialData?.file_path ?? ""
    );

  const [loading, setLoading] =
    useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setLoading(true);

    try {

      await onSubmit({

        lesson_id: lessonId,

        title: title.trim(),

        file_type: fileType,

        file_path: filePath.trim(),

      });

    } finally {

      setLoading(false);

    }

  }

  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >

      <SelectField
        label="Materi"
        value={lessonId}
        options={[
          {
            value: "",
            label: "Pilih Materi",
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
        label="File Path"
        value={filePath}
        required
        onChange={setFilePath}
      />

      <div className="flex justify-end">

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "Menyimpan..."
            : submitLabel}
        </button>

      </div>

    </form>

  );

}