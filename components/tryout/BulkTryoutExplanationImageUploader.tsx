"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { updateTryoutQuestionAction } from "@/app/dashboard/admin/tryout/actions";
import { createClient } from "@/lib/supabase/client";
import type { TryoutQuestionWithOptions } from "@/types/tryout";

interface BulkUploadProps {
  tryoutId: string;
  questions: TryoutQuestionWithOptions[];
}

type UploadTarget = {
  file: File;
  question: TryoutQuestionWithOptions;
  number: number;
};

type UploadResponse = {
  provider: "r2" | "supabase";
  uploadUrl?: string;
  headers?: Record<string, string>;
  bucket?: string;
  objectPath: string;
  filePath: string;
  message?: string;
};

const filenamePattern = /^soal_(\d{1,2})_pembahasan\.(jpe?g|png|webp)$/i;
const maxImageSize = 5 * 1024 * 1024;

function getMimeType(file: File) {
  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") {
    return file.type;
  }
  return /\.png$/i.test(file.name) ? "image/png"
    : /\.webp$/i.test(file.name) ? "image/webp"
      : "image/jpeg";
}

async function uploadImage(tryoutId: string, file: File): Promise<UploadResponse> {
  const contentType = getMimeType(file);
  const response = await fetch("/api/uploads/tryout-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tryoutId,
      kind: "explanation",
      fileName: file.name,
      fileSize: file.size,
      contentType,
    }),
  });
  const uploaded = await response.json() as UploadResponse;
  if (!response.ok) throw new Error(uploaded.message || "Lokasi unggah tidak tersedia.");

  if (uploaded.provider === "r2") {
    if (!uploaded.uploadUrl) throw new Error("URL unggah R2 tidak ditemukan.");
    const put = await fetch(uploaded.uploadUrl, {
      method: "PUT",
      headers: uploaded.headers ?? {},
      body: file,
    });
    if (!put.ok) throw new Error(`Gagal mengunggah ${file.name} (HTTP ${put.status}).`);
  } else {
    const db = createClient();
    const { error } = await db.storage
      .from(uploaded.bucket ?? "course-materials")
      .upload(uploaded.objectPath, file, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });
    if (error) throw new Error(error.message);
  }
  return uploaded;
}

async function deleteUploadedFile(tryoutId: string, path: string) {
  await fetch("/api/uploads/tryout-image", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tryoutId, kind: "explanation", filePath: path }),
  });
}

function makeQuestionForm(
  question: TryoutQuestionWithOptions,
  explanationImagePath: string,
): FormData {
  const ordered = [...question.options].sort((a, b) => a.option_order - b.option_order);
  if (![4, 5].includes(ordered.length)) {
    throw new Error(`Pilihan soal ${question.question_order} tidak lengkap.`);
  }
  const answerIndex = ordered.findIndex((option) => option.is_correct);
  if (answerIndex < 0) throw new Error(`Kunci soal ${question.question_order} tidak ditemukan.`);

  const data = new FormData();
  data.set("question", question.question);
  data.set("explanation", question.explanation ?? "");
  data.set("topic", question.topic);
  data.set("difficulty", question.difficulty);
  data.set("points", String(question.points));
  data.set("optionCount", String(ordered.length));
  data.set("correctOptionIndex", String(answerIndex + 1));
  data.set("imagePath", question.image_path ?? "");
  data.set("explanationImagePath", explanationImagePath);
  ordered.forEach((option, index) => {
    data.set(`option${String.fromCharCode(65 + index)}`, option.option_text);
  });
  return data;
}

export default function BulkTryoutExplanationImageUploader({
  tryoutId,
  questions,
}: BulkUploadProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ finished: 0, total: 0, success: 0 });
  const [feedback, setFeedback] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  function calculateTargets(files: File[]) {
    const byOrder = new Map(questions.map((question) => [question.question_order, question]));
    const matches: UploadTarget[] = [];
    const rejected: string[] = [];
    const seen = new Set<number>();

    for (const file of files) {
      const match = filenamePattern.exec(file.name);
      const number = match ? Number(match[1]) : NaN;
      const question = byOrder.get(number);
      if (!match || !question) {
        rejected.push(`${file.name}: nama atau nomor soal tidak dikenali`);
      } else if (seen.has(number)) {
        rejected.push(`${file.name}: nomor soal ${number} duplikat`);
      } else if (file.size < 1 || file.size > maxImageSize) {
        rejected.push(`${file.name}: ukuran harus 1 byte–5 MB`);
      } else if (question.explanation_image_path) {
        rejected.push(`${file.name}: gambar pembahasan sudah terpasang; tidak ditimpa`);
      } else {
        seen.add(number);
        matches.push({ file, question, number });
      }
    }
    matches.sort((a, b) => a.number - b.number);
    return { matches, rejected };
  }

  const prepared = calculateTargets(selected);

  async function runUpload() {
    if (busy || !selected.length) return;
    if (prepared.rejected.length) {
      setErrors(prepared.rejected);
      setFeedback("Periksa nama file yang ditolak sebelum mulai mengunggah.");
      return;
    }
    if (!prepared.matches.length) {
      setFeedback("Tidak ada gambar baru yang cocok dengan soal.");
      return;
    }

    setBusy(true);
    setErrors([]);
    setFeedback("");
    let success = 0;
    const failures: string[] = [];
    setProgress({ finished: 0, total: prepared.matches.length, success: 0 });

    for (let index = 0; index < prepared.matches.length; index++) {
      const target = prepared.matches[index];
      let newPath = "";
      try {
        const uploaded = await uploadImage(tryoutId, target.file);
        newPath = uploaded.filePath;
        const form = makeQuestionForm(target.question, newPath);
        const result = await updateTryoutQuestionAction(tryoutId, target.question.id, form);
        if (!result.success) throw new Error(result.message);
        success++;
      } catch (error) {
        failures.push(`Soal ${target.number}: ${error instanceof Error ? error.message : "unggah gagal"}`);
        if (newPath) await deleteUploadedFile(tryoutId, newPath).catch(() => undefined);
      }
      setProgress({ finished: index + 1, total: prepared.matches.length, success });
    }

    setBusy(false);
    setErrors(failures);
    setFeedback(`${success} dari ${prepared.matches.length} gambar berhasil ditautkan. ${failures.length ? "Periksa yang gagal di bawah." : "Semua selesai."}`);
    setSelected([]);
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        Unggah Gambar Pembahasan Massal
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950">
        Pilih semua gambar sekaligus
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Ekstrak ZIP terlebih dahulu, lalu pilih semua JPG di dalam folder hasil ekstraksi.
        Nama seperti <code>soal_01_pembahasan.jpg</code> akan otomatis dipasangkan dengan Soal 1.
        Hanya gambar pembahasan yang ditambahkan; teks soal, pilihan, dan kunci tetap.
      </p>

      <input
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        onChange={(event) => {
          setSelected(Array.from(event.currentTarget.files ?? []));
          setFeedback("");
          setErrors([]);
        }}
        className="mt-4 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-3 file:py-2 file:font-bold file:text-emerald-900"
      />

      {selected.length > 0 && (
        <p className="mt-3 text-sm font-semibold text-slate-700">
          {selected.length} gambar dipilih · {prepared.matches.length} cocok
          {prepared.rejected.length > 0 ? ` · ${prepared.rejected.length} perlu diperbaiki` : ""}
        </p>
      )}

      {feedback && <p className="mt-3 text-sm font-bold text-slate-700" role="status">{feedback}</p>}
      {busy && (
        <p className="mt-3 text-sm font-bold text-blue-700" role="status">
          Memproses {progress.finished}/{progress.total}; berhasil {progress.success}.
          Jangan tutup halaman selama pengunggahan.
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mt-3 max-h-48 list-disc space-y-1 overflow-auto pl-5 text-xs font-semibold text-red-700">
          {errors.map((error, index) => <li key={index}>{error}</li>)}
        </ul>
      )}

      <button
        type="button"
        disabled={busy || prepared.matches.length === 0 || prepared.rejected.length > 0}
        onClick={runUpload}
        className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Mengunggah..." : `Unggah ${prepared.matches.length} Gambar`}
      </button>
    </section>
  );
}
