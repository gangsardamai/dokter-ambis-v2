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

  onSubmit: (
    data: LessonFormData
  ) => Promise<void>;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function LessonForm({
  initialData,
  courseOptions,
  submitLabel = "Simpan",
  onSubmit,
}: LessonFormProps) {

  const [courseId, setCourseId] =
    useState(
      initialData?.course_id ?? ""
    );

  const [title, setTitle] =
    useState(
      initialData?.title ?? ""
    );

  const [slug, setSlug] =
    useState(
      initialData?.slug ?? ""
    );

  const [description, setDescription] =
    useState(
      initialData?.description ?? ""
    );

  const [duration, setDuration] =
    useState(
      initialData?.duration ?? 0
    );

  const [lessonOrder, setLessonOrder] =
    useState(
      initialData?.lesson_order ?? 1
    );

  const [isFree, setIsFree] =
    useState(
      initialData?.is_free ?? false
    );

  const [loading, setLoading] =
    useState(false);

  const [slugEdited, setSlugEdited] =
    useState(
      Boolean(initialData?.slug)
    );

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setLoading(true);

    try {

      await onSubmit({

        course_id: courseId,

        title: title.trim(),

        slug: slug.trim(),

        description: description.trim(),

        duration,

        lesson_order: lessonOrder,

        is_free: isFree,

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
        label="Blok"
        value={courseId}
        options={[
          {
            value: "",
            label: "Pilih Blok",
          },
          ...courseOptions,
        ]}
        onChange={setCourseId}
      />

      <TextInput
        label="Nama Materi"
        value={title}
        required
        onChange={(value) => {

          setTitle(value);

          if (!slugEdited) {
            setSlug(
              slugify(value)
            );
          }

        }}
      />

      <TextInput
        label="Slug"
        value={slug}
        required
        onChange={(value) => {

          setSlugEdited(true);

          setSlug(value);

        }}
      />

      <TextArea
        label="Deskripsi"
        value={description}
        onChange={setDescription}
      />

      <TextInput
        label="Durasi (menit)"
        type="number"
        value={String(duration)}
        onChange={(value) =>
          setDuration(Number(value))
        }
      />

      <TextInput
        label="Urutan Materi"
        type="number"
        value={String(lessonOrder)}
        onChange={(value) =>
          setLessonOrder(Number(value))
        }
      />

      <div className="flex items-center gap-3">

        <input
          type="checkbox"
          checked={isFree}
          onChange={(e) =>
            setIsFree(
              e.target.checked
            )
          }
        />

        <span>
          Materi Gratis
        </span>

      </div>

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