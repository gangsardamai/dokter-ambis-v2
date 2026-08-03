"use client";

import { useState } from "react";

import {
  TextInput,
  TextArea,
  SelectField,
} from "@/components/ui";

export type LessonFormData = {
  course_id: string;
  title: string;
  slug: string;
  description: string;
  duration: number;
  lesson_order: number;
  is_free: boolean;
};

interface SelectOption {
  value: string;
  label: string;
}

interface LessonFormProps {
  initialData?: LessonFormData;
  courseOptions: SelectOption[];
  submitLabel?: string;
  onSubmit: (data: LessonFormData) => Promise<void>;
}

export default function LessonForm({
  initialData,
  courseOptions,
  submitLabel = "Simpan",
  onSubmit,
}: LessonFormProps) {
  const [courseId, setCourseId] = useState(
    initialData?.course_id ?? "",
  );
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [lessonOrder, setLessonOrder] = useState(
    initialData?.lesson_order ?? 1,
  );
  const [isFree, setIsFree] = useState(
    initialData?.is_free ?? false,
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        course_id: courseId,
        title: title.trim(),
        slug: initialData?.slug ?? "",
        description: description.trim(),
        duration: initialData?.duration ?? 1,
        lesson_order: lessonOrder,
        is_free: isFree,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SelectField
        label="Blok"
        value={courseId}
        options={[
          { value: "", label: "Pilih Blok" },
          ...courseOptions,
        ]}
        onChange={setCourseId}
      />

      <TextInput
        label="Nama Materi"
        value={title}
        required
        onChange={setTitle}
      />

      <TextArea
        label="Deskripsi"
        value={description}
        onChange={setDescription}
      />

      <TextInput
        label="Urutan Materi"
        type="number"
        value={String(lessonOrder)}
        onChange={(value) => setLessonOrder(Number(value))}
      />

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isFree}
          onChange={(event) => setIsFree(event.target.checked)}
        />
        <span>Materi Gratis</span>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
