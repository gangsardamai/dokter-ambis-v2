"use client";

import { useState } from "react";

import {
  SelectField,
  TextInput,
} from "@/components/ui";

export type QuizFormData = {
  lesson_id: string;
  title: string;
  duration: number;
  total_questions: number;
  passing_score: number;
  max_attempt: number;
  quiz_order: number;
  publication_status: string;
  is_required: boolean;
  shuffle_questions: boolean;
  shuffle_options: boolean;
};

interface SelectOption {
  value: string;
  label: string;
}

interface QuizFormProps {
  initialData?: QuizFormData;
  initialLessonId?: string;
  lessonOptions: SelectOption[];
  submitLabel?: string;
  onSubmit: (
    data: QuizFormData,
  ) => Promise<void>;
}

export default function QuizForm({
  initialData,
  initialLessonId,
  lessonOptions,
  submitLabel = "Simpan",
  onSubmit,
}: QuizFormProps) {
  const [lessonId, setLessonId] = useState(
    initialData?.lesson_id ?? initialLessonId ?? "",
  );
  const [title, setTitle] = useState(
    initialData?.title ?? "",
  );
  const [duration, setDuration] = useState(
    initialData?.duration ?? 10,
  );
  const [totalQuestions] = useState(
    initialData?.total_questions ?? 0,
  );
  const [passingScore, setPassingScore] = useState(
    initialData?.passing_score ?? 70,
  );
  const [maxAttempt, setMaxAttempt] = useState(
    initialData?.max_attempt ?? 2,
  );
  const [quizOrder, setQuizOrder] = useState(
    initialData?.quiz_order ?? 1,
  );
  const [publicationStatus, setPublicationStatus] =
    useState(
      initialData?.publication_status ?? "draft",
    );
  const [isRequired, setIsRequired] = useState(
    initialData?.is_required ?? true,
  );
  const [shuffleQuestions, setShuffleQuestions] =
    useState(
      initialData?.shuffle_questions ?? true,
    );
  const [shuffleOptions, setShuffleOptions] =
    useState(
      initialData?.shuffle_options ?? true,
    );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage("");

    if (!lessonId || !title.trim()) {
      setErrorMessage(
        "Lesson dan judul quiz wajib diisi.",
      );
      return;
    }

    if (
      duration < 1 ||
      passingScore < 0 ||
      passingScore > 100 ||
      maxAttempt < 1 ||
      quizOrder < 1
    ) {
      setErrorMessage(
        "Periksa kembali durasi, nilai lulus, percobaan, dan urutan quiz.",
      );
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        lesson_id: lessonId,
        title: title.trim(),
        duration,
        total_questions: totalQuestions,
        passing_score: passingScore,
        max_attempt: maxAttempt,
        quiz_order: quizOrder,
        publication_status: publicationStatus,
        is_required: isRequired,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Quiz gagal disimpan.",
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
        label="Judul Quiz"
        required
        value={title}
        onChange={setTitle}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label="Durasi (menit)"
          type="number"
          value={String(duration)}
          onChange={(value) =>
            setDuration(Number(value))
          }
        />

        <TextInput
          label="Urutan Quiz"
          type="number"
          value={String(quizOrder)}
          onChange={(value) =>
            setQuizOrder(Number(value))
          }
        />

        <TextInput
          label="Nilai Lulus"
          type="number"
          value={String(passingScore)}
          onChange={(value) =>
            setPassingScore(Number(value))
          }
        />

        <TextInput
          label="Maksimal Percobaan"
          type="number"
          value={String(maxAttempt)}
          onChange={(value) =>
            setMaxAttempt(Number(value))
          }
        />
      </div>

      <SelectField
        label="Status Publikasi"
        value={publicationStatus}
        onChange={setPublicationStatus}
        options={[
          {
            value: "draft",
            label: "Draft",
          },
          {
            value: "published",
            label: "Published",
          },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(event) =>
              setIsRequired(event.target.checked)
            }
            className="h-4 w-4 accent-blue-600"
          />
          Quiz wajib
        </label>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(event) =>
              setShuffleQuestions(
                event.target.checked,
              )
            }
            className="h-4 w-4 accent-blue-600"
          />
          Acak soal
        </label>

        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={shuffleOptions}
            onChange={(event) =>
              setShuffleOptions(
                event.target.checked,
              )
            }
            className="h-4 w-4 accent-blue-600"
          />
          Acak pilihan
        </label>
      </div>

      <p className="text-xs leading-5 text-slate-500">
        Jumlah soal dihitung otomatis dari bank soal.
        Kunci jawaban dan pembahasan baru terlihat oleh peserta setelah percobaan terakhir.
      </p>

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
