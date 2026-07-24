"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type QuizImageKind = "question" | "explanation";

interface StorageUploadResponse {
  provider: "r2" | "supabase";
  bucket?: string;
  uploadUrl?: string;
  headers?: Record<string, string>;
  objectPath: string;
  filePath: string;
  message?: string;
}

interface QuizQuestionCreateFormProps {
  quizId: string;
  action: (formData: FormData) => Promise<void>;
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

async function requestUpload(
  quizId: string,
  kind: QuizImageKind,
  file: File,
): Promise<StorageUploadResponse> {
  const response = await fetch("/api/uploads/quiz-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quizId,
      kind,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    }),
  });
  const payload =
    (await response.json()) as StorageUploadResponse;

  if (!response.ok) {
    throw new Error(
      payload.message || "Lokasi upload gambar gagal dibuat.",
    );
  }

  return payload;
}

async function uploadFile(
  file: File,
  upload: StorageUploadResponse,
): Promise<void> {
  if (upload.provider === "r2") {
    if (!upload.uploadUrl) {
      throw new Error("URL upload Cloudflare R2 tidak tersedia.");
    }

    const response = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: upload.headers ?? {},
      body: file,
    });

    if (!response.ok) {
      throw new Error(
        `Upload gambar ke Cloudflare R2 gagal (${response.status}).`,
      );
    }

    return;
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(upload.bucket ?? "course-materials")
    .upload(upload.objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function cleanupUpload(
  quizId: string,
  kind: QuizImageKind,
  filePath: string,
): Promise<void> {
  try {
    await fetch("/api/uploads/quiz-image", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quizId,
        kind,
        filePath,
      }),
    });
  } catch {
    // Cleanup is best-effort. The original form error remains primary.
  }
}

export default function QuizQuestionCreateForm({
  quizId,
  action,
}: QuizQuestionCreateFormProps) {
  const router = useRouter();
  const [questionImage, setQuestionImage] =
    useState<File | null>(null);
  const [explanationImage, setExplanationImage] =
    useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const uploaded: Array<{
      kind: QuizImageKind;
      filePath: string;
    }> = [];

    try {
      if (questionImage) {
        const upload = await requestUpload(
          quizId,
          "question",
          questionImage,
        );
        await uploadFile(questionImage, upload);
        formData.set("image_path", upload.filePath);
        uploaded.push({
          kind: "question",
          filePath: upload.filePath,
        });
      }

      if (explanationImage) {
        const upload = await requestUpload(
          quizId,
          "explanation",
          explanationImage,
        );
        await uploadFile(explanationImage, upload);
        formData.set(
          "explanation_image_path",
          upload.filePath,
        );
        uploaded.push({
          kind: "explanation",
          filePath: upload.filePath,
        });
      }

      await action(formData);

      form.reset();
      setQuestionImage(null);
      setExplanationImage(null);
      setSuccessMessage("Soal berhasil disimpan.");
      router.refresh();
    } catch (error) {
      await Promise.all(
        uploaded.map((item) =>
          cleanupUpload(quizId, item.kind, item.filePath),
        ),
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Soal gagal disimpan.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      {errorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {successMessage}
        </div>
      )}

      <label className="block">
        <span className="text-sm font-bold text-slate-700">
          Pertanyaan
        </span>
        <textarea
          name="question"
          required
          rows={4}
          className={`${inputClass} mt-2 resize-y`}
        />
      </label>

      <label className="block rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <span className="text-sm font-black text-slate-800">
          Foto Soal (opsional)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) =>
            setQuestionImage(event.target.files?.[0] ?? null)
          }
          className="mt-3 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-3 file:py-2 file:font-bold file:text-blue-700"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          JPG, PNG, atau WebP. Maksimal 5 MB. Gambar akan tampil bersama pertanyaan.
        </p>
        {questionImage && (
          <p className="mt-2 text-xs font-bold text-blue-700">
            Dipilih: {questionImage.name}
          </p>
        )}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                Pilihan {String.fromCharCode(65 + index)}
              </span>
              <input
                name={`option_${index}`}
                required
                className={`${inputClass} mt-2`}
              />
            </label>

            <label className="mt-3 flex min-h-10 cursor-pointer items-center gap-2 text-sm font-bold text-emerald-700">
              <input
                type="radio"
                name="correct_option"
                value={index}
                required
                className="h-4 w-4 accent-emerald-600"
              />
              Jadikan kunci jawaban
            </label>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            Pembahasan
          </span>
          <textarea
            name="explanation"
            rows={3}
            className={`${inputClass} mt-2 resize-y`}
          />
        </label>

        <label className="block">
          <span className="text-sm font-bold text-slate-700">
            Skor
          </span>
          <input
            type="number"
            name="points"
            min={1}
            defaultValue={1}
            required
            className={`${inputClass} mt-2`}
          />
        </label>
      </div>

      <label className="block rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
        <span className="text-sm font-black text-slate-800">
          Foto Pembahasan (opsional)
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) =>
            setExplanationImage(
              event.target.files?.[0] ?? null,
            )
          }
          className="mt-3 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-bold file:text-emerald-700"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Gambar ini hanya tampil bersama pembahasan setelah percobaan terakhir.
        </p>
        {explanationImage && (
          <p className="mt-2 text-xs font-bold text-emerald-700">
            Dipilih: {explanationImage.name}
          </p>
        )}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-[#064a78] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/10 transition hover:from-blue-700 hover:to-[#053b67] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Mengunggah dan menyimpan..." : "Simpan Soal"}
      </button>
    </form>
  );
}
