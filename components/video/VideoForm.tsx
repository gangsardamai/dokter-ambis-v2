"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  SelectField,
  TextInput,
} from "@/components/ui";

import type { Database } from "@/supabase/types/database.types";

export type VideoProvider =
  Database["public"]["Enums"]["video_provider"];

export type VideoFormData = {
  lesson_id: string;
  title: string;
  provider: VideoProvider;
  provider_video_id: string;
  duration: number;
};

interface SelectOption {
  value: string;
  label: string;
}

interface VideoFormProps {
  initialData?: VideoFormData;
  lessonOptions: SelectOption[];
  submitLabel?: string;

  onSubmit: (
    data: VideoFormData,
  ) => Promise<void>;
}

function extractYoutubeVideoId(
  value: string,
): string | null {
  const input = value.trim();

  if (!input) {
    return null;
  }

  /*
   * Izinkan ID YouTube langsung.
   */
  if (
    /^[a-zA-Z0-9_-]{11}$/.test(
      input,
    )
  ) {
    return input;
  }

  try {
    const url = new URL(input);

    const hostname =
      url.hostname
        .replace(/^www\./, "")
        .toLowerCase();

    if (hostname === "youtu.be") {
      const id =
        url.pathname
          .split("/")
          .filter(Boolean)[0];

      return id &&
        /^[a-zA-Z0-9_-]{11}$/.test(id)
        ? id
        : null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      const watchId =
        url.searchParams.get("v");

      if (
        watchId &&
        /^[a-zA-Z0-9_-]{11}$/.test(
          watchId,
        )
      ) {
        return watchId;
      }

      const pathParts =
        url.pathname
          .split("/")
          .filter(Boolean);

      if (
        pathParts[0] === "embed" ||
        pathParts[0] === "shorts" ||
        pathParts[0] === "live"
      ) {
        const id =
          pathParts[1];

        return id &&
          /^[a-zA-Z0-9_-]{11}$/.test(id)
          ? id
          : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getInitialVideoInput(
  initialData?: VideoFormData,
): string {
  if (!initialData) {
    return "";
  }

  if (
    initialData.provider === "youtube" &&
    initialData.provider_video_id
  ) {
    return `https://www.youtube.com/watch?v=${initialData.provider_video_id}`;
  }

  return initialData.provider_video_id;
}

export default function VideoForm({
  initialData,
  lessonOptions,
  submitLabel = "Simpan",
  onSubmit,
}: VideoFormProps) {
  const [
    lessonId,
    setLessonId,
  ] = useState(
    initialData?.lesson_id ?? "",
  );

  const [
    title,
    setTitle,
  ] = useState(
    initialData?.title ?? "",
  );

  const [
    youtubeUrl,
    setYoutubeUrl,
  ] = useState(
    getInitialVideoInput(
      initialData,
    ),
  );

  const [
    duration,
    setDuration,
  ] = useState(
    initialData?.duration ?? 0,
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const youtubeVideoId =
    useMemo(
      () =>
        extractYoutubeVideoId(
          youtubeUrl,
        ),
      [youtubeUrl],
    );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!lessonId) {
      setErrorMessage(
        "Silakan pilih materi terlebih dahulu.",
      );

      return;
    }

    if (!title.trim()) {
      setErrorMessage(
        "Judul video wajib diisi.",
      );

      return;
    }

    if (!youtubeVideoId) {
      setErrorMessage(
        "URL YouTube tidak valid. Gunakan URL youtube.com atau youtu.be.",
      );

      return;
    }

    if (
      !Number.isFinite(duration) ||
      duration < 0
    ) {
      setErrorMessage(
        "Durasi video tidak valid.",
      );

      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        lesson_id:
          lessonId,

        title:
          title.trim(),

        provider:
          "youtube",

        /*
         * Action akan memastikan nilai ini
         * disimpan sebagai Video ID.
         */
        provider_video_id:
          youtubeUrl.trim(),

        duration,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Video gagal disimpan.",
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

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
        label="Judul Video"
        required
        value={title}
        onChange={setTitle}
      />

      <div>
        <TextInput
          label="URL YouTube"
          required
          value={youtubeUrl}
          onChange={setYoutubeUrl}
        />

        <p className="mt-2 text-xs text-gray-500">
          Contoh:
          https://www.youtube.com/watch?v=xxxxxxxxxxx
          atau https://youtu.be/xxxxxxxxxxx
        </p>

        {youtubeUrl &&
          !youtubeVideoId && (
            <p className="mt-2 text-sm text-red-600">
              URL YouTube belum valid.
            </p>
          )}
      </div>

      <TextInput
        label="Durasi (menit)"
        type="number"
        value={String(duration)}
        onChange={(value) =>
          setDuration(
            Number(value),
          )
        }
      />

      {youtubeVideoId && (
        <div className="overflow-hidden rounded-xl border bg-black">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}`}
              title="Preview video YouTube"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            loading ||
            !youtubeVideoId
          }
          className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Menyimpan..."
            : submitLabel}
        </button>
      </div>
    </form>
  );
}