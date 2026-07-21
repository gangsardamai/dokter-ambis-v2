"use client";

import { useState } from "react";

import {
  TextInput,
  SelectField,
} from "@/components/ui";

export type QuizFormData = {
  lesson_id: string;
  title: string;
  duration: number;
  total_questions: number;
  passing_score: number;
  max_attempt: number;
};

interface SelectOption {
  value: string;
  label: string;
}

interface QuizFormProps {
  initialData?: QuizFormData;

  lessonOptions: SelectOption[];

  submitLabel?: string;

  onSubmit: (
    data: QuizFormData
  ) => Promise<void>;
}

export default function QuizForm({
  initialData,
  lessonOptions,
  submitLabel = "Simpan",
  onSubmit,
}: QuizFormProps) {

  const [lessonId, setLessonId] =
    useState(
      initialData?.lesson_id ?? ""
    );

  const [title, setTitle] =
    useState(
      initialData?.title ?? ""
    );

  const [duration, setDuration] =
    useState(
      initialData?.duration ?? 0
    );

  const [
    totalQuestions,
    setTotalQuestions,
  ] = useState(
    initialData?.total_questions ?? 0
  );

  const [
    passingScore,
    setPassingScore,
  ] = useState(
    initialData?.passing_score ?? 75
  );

  const [
    maxAttempt,
    setMaxAttempt,
  ] = useState(
    initialData?.max_attempt ?? 1
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

        duration,

        total_questions:
          totalQuestions,

        passing_score:
          passingScore,

        max_attempt:
          maxAttempt,

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
        label="Judul Quiz"
        required
        value={title}
        onChange={setTitle}
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
        label="Jumlah Soal"
        type="number"
        value={String(totalQuestions)}
        onChange={(value) =>
          setTotalQuestions(
            Number(value)
          )
        }
      />

      <TextInput
        label="Passing Score"
        type="number"
        value={String(passingScore)}
        onChange={(value) =>
          setPassingScore(
            Number(value)
          )
        }
      />

      <TextInput
        label="Max Attempt"
        type="number"
        value={String(maxAttempt)}
        onChange={(value) =>
          setMaxAttempt(
            Number(value)
          )
        }
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