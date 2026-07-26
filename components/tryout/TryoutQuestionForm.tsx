"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { TryoutQuestionWithOptions } from "@/types/tryout";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
type ImageKind = "question" | "explanation";

interface UploadResponse {
  provider: "r2" | "supabase";
  bucket?: string;
  uploadUrl?: string;
  headers?: Record<string, string>;
  objectPath: string;
  filePath: string;
  message?: string;
}

interface ActionResult {
  success: boolean;
  message: string;
}

interface TryoutQuestionFormProps {
  tryoutId: string;
  action: (formData: FormData) => Promise<ActionResult>;
  question?: TryoutQuestionWithOptions | null;
  afterSaveHref?: string;
}

const inputClass =
  "min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const labelClass = "mb-1.5 block text-sm font-black text-slate-700";

function validateFile(file: File | null): File | null {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Gambar harus berformat JPG, PNG, atau WebP.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Ukuran gambar maksimal 5 MB.");
  }
  return file;
}

async function requestUpload(
  tryoutId: string,
  kind: ImageKind,
  file: File,
): Promise<UploadResponse> {
  const response = await fetch("/api/uploads/tryout-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tryoutId,
      kind,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    }),
  });
  const payload = (await response.json()) as UploadResponse;
  if (!response.ok) {
    throw new Error(payload.message || "Lokasi upload gagal dibuat.");
  }
  return payload;
}

async function uploadFile(
  file: File,
  upload: UploadResponse,
): Promise<void> {
  if (upload.provider === "r2") {
    if (!upload.uploadUrl) {
      throw new Error("URL upload R2 tidak tersedia.");
    }
    const response = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: upload.headers ?? {},
      body: file,
    });
    if (!response.ok) {
      throw new Error(`Upload gambar gagal (${response.status}).`);
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
  if (error) throw new Error(error.message);
}

async function deleteUpload(
  tryoutId: string,
  kind: ImageKind,
  filePath: string,
): Promise<void> {
  if (!filePath) return;
  await fetch("/api/uploads/tryout-image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tryoutId, kind, filePath }),
  });
}

function FilePicker({
  title,
  tone,
  file,
  onFile,
  existingPath,
  removeExisting,
  onRemoveExisting,
  previewUrl,
}: {
  title: string;
  tone: "blue" | "emerald";
  file: File | null;
  onFile: (file: File | null) => void;
  existingPath: string;
  removeExisting: boolean;
  onRemoveExisting: () => void;
  previewUrl: string;
}) {
  const toneClass =
    tone === "blue"
      ? "border-blue-100 bg-blue-50/50"
      : "border-emerald-100 bg-emerald-50/50";

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-black text-slate-800">{title} (opsional)</p>

      {existingPath && !removeExisting && !file && (
        <div className="mt-3">
          <Image
            src={previewUrl}
            alt={title}
            width={900}
            height={520}
            unoptimized
            className="max-h-64 w-auto rounded-xl border border-white object-contain"
          />
          <button
            type="button"
            onClick={onRemoveExisting}
            className="mt-2 text-xs font-black text-red-700 hover:underline"
          >
            Hapus gambar tersimpan
          </button>
        </div>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          try {
            onFile(validateFile(event.target.files?.[0] ?? null));
          } catch (error) {
            event.target.value = "";
            window.alert(
              error instanceof Error ? error.message : "Gambar tidak valid.",
            );
          }
        }}
        className="mt-3 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-bold"
      />
      <p className="mt-2 text-xs text-slate-500">
        JPG, PNG, atau WebP. Maksimal 5 MB.
      </p>
      {file && (
        <p className="mt-2 text-xs font-bold text-blue-700">
          Dipilih: {file.name}
        </p>
      )}
      {removeExisting && !file && (
        <p className="mt-2 text-xs font-bold text-red-700">
          Gambar akan dihapus saat disimpan.
        </p>
      )}
    </div>
  );
}

export default function TryoutQuestionForm({
  tryoutId,
  action,
  question,
  afterSaveHref,
}: TryoutQuestionFormProps) {
  const router = useRouter();
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [explanationImage, setExplanationImage] = useState<File | null>(null);
  const [removeQuestionImage, setRemoveQuestionImage] = useState(false);
  const [removeExplanationImage, setRemoveExplanationImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ActionResult | null>(null);

  const optionValues = Array.from(
    { length: 4 },
    (_, index) => question?.options[index]?.option_text ?? "",
  );
  const correctIndex = Math.max(
    (question?.options.findIndex((item) => item.is_correct) ?? 0) + 1,
    1,
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFeedback(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const uploaded: Array<{ kind: ImageKind; path: string }> = [];
    const oldQuestionPath = question?.image_path ?? "";
    const oldExplanationPath = question?.explanation_image_path ?? "";

    try {
      let questionPath = removeQuestionImage ? "" : oldQuestionPath;
      let explanationPath = removeExplanationImage
        ? ""
        : oldExplanationPath;

      if (questionImage) {
        const upload = await requestUpload(
          tryoutId,
          "question",
          questionImage,
        );
        await uploadFile(questionImage, upload);
        questionPath = upload.filePath;
        uploaded.push({ kind: "question", path: upload.filePath });
      }

      if (explanationImage) {
        const upload = await requestUpload(
          tryoutId,
          "explanation",
          explanationImage,
        );
        await uploadFile(explanationImage, upload);
        explanationPath = upload.filePath;
        uploaded.push({ kind: "explanation", path: upload.filePath });
      }

      formData.set("imagePath", questionPath);
      formData.set("explanationImagePath", explanationPath);
      const result = await action(formData);
      if (!result.success) throw new Error(result.message);

      const cleanup: Promise<void>[] = [];
      if (oldQuestionPath && oldQuestionPath !== questionPath) {
        cleanup.push(deleteUpload(tryoutId, "question", oldQuestionPath));
      }
      if (oldExplanationPath && oldExplanationPath !== explanationPath) {
        cleanup.push(
          deleteUpload(tryoutId, "explanation", oldExplanationPath),
        );
      }
      await Promise.allSettled(cleanup);

      setFeedback(result);
      if (afterSaveHref) {
        router.push(afterSaveHref);
      } else {
        form.reset();
        setQuestionImage(null);
        setExplanationImage(null);
        setRemoveQuestionImage(false);
        setRemoveExplanationImage(false);
        router.refresh();
      }
    } catch (error) {
      await Promise.allSettled(
        uploaded.map((item) =>
          deleteUpload(tryoutId, item.kind, item.path),
        ),
      );
      setFeedback({
        success: false,
        message:
          error instanceof Error ? error.message : "Soal gagal disimpan.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {feedback && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${
            feedback.success
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div>
        <label htmlFor="question" className={labelClass}>
          Pertanyaan
        </label>
        <textarea
          id="question"
          name="question"
          rows={6}
          required
          defaultValue={question?.question ?? ""}
          className={`${inputClass} py-3`}
          placeholder="Tuliskan vignette dan pertanyaan klinis..."
        />
      </div>

      <FilePicker
        title="Gambar Soal"
        tone="blue"
        file={questionImage}
        onFile={(file) => {
          setQuestionImage(file);
          if (file) setRemoveQuestionImage(false);
        }}
        existingPath={question?.image_path ?? ""}
        removeExisting={removeQuestionImage}
        onRemoveExisting={() => setRemoveQuestionImage(true)}
        previewUrl={`/api/tryout-images/${tryoutId}/${question?.id ?? "new"}?kind=question`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="topic" className={labelClass}>
            Topik
          </label>
          <input
            id="topic"
            name="topic"
            required
            defaultValue={question?.topic ?? "Umum"}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="difficulty" className={labelClass}>
            Kesulitan
          </label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={question?.difficulty ?? "medium"}
            className={inputClass}
          >
            <option value="easy">Mudah</option>
            <option value="medium">Sedang</option>
            <option value="hard">Sulit</option>
          </select>
        </div>
        <div>
          <label htmlFor="points" className={labelClass}>
            Bobot
          </label>
          <input
            id="points"
            name="points"
            type="number"
            min={1}
            required
            defaultValue={question?.points ?? 1}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {optionValues.map((value, index) => {
          const letter = String.fromCharCode(65 + index);
          return (
            <div key={letter}>
              <label htmlFor={`option${letter}`} className={labelClass}>
                Pilihan {letter}
              </label>
              <input
                id={`option${letter}`}
                name={`option${letter}`}
                required
                defaultValue={value}
                className={inputClass}
              />
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="correctOptionIndex" className={labelClass}>
            Jawaban Benar
          </label>
          <select
            id="correctOptionIndex"
            name="correctOptionIndex"
            defaultValue={String(correctIndex)}
            className={inputClass}
          >
            {[1, 2, 3, 4].map((index) => (
              <option key={index} value={index}>
                {String.fromCharCode(64 + index)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="explanation" className={labelClass}>
            Pembahasan
          </label>
          <textarea
            id="explanation"
            name="explanation"
            rows={4}
            defaultValue={question?.explanation ?? ""}
            className={`${inputClass} py-3`}
          />
        </div>
      </div>

      <FilePicker
        title="Gambar Pembahasan"
        tone="emerald"
        file={explanationImage}
        onFile={(file) => {
          setExplanationImage(file);
          if (file) setRemoveExplanationImage(false);
        }}
        existingPath={question?.explanation_image_path ?? ""}
        removeExisting={removeExplanationImage}
        onRemoveExisting={() => setRemoveExplanationImage(true)}
        previewUrl={`/api/tryout-images/${tryoutId}/${question?.id ?? "new"}?kind=explanation`}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center rounded-xl bg-gradient-to-r from-blue-600 to-[#033b63] px-6 py-2.5 text-sm font-black text-white disabled:opacity-60"
        >
          {submitting
            ? "Mengunggah dan menyimpan..."
            : question
              ? "Simpan Perubahan"
              : "Tambahkan Soal"}
        </button>
      </div>
    </form>
  );
}
