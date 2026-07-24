"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  SelectField,
  TextInput,
} from "@/components/ui";
import GoogleDrivePlayer from "@/components/video/GoogleDrivePlayer";
import {
  getVideoInputHelp,
  getVideoInputLabel,
  getVideoSourceInput,
  normalizeVideoSource,
  type SupportedVideoProvider,
  type VideoFormPayload,
} from "@/lib/video/video-source";

export type VideoProvider = SupportedVideoProvider;
export type VideoFormData = VideoFormPayload;

interface SelectOption {
  value: string;
  label: string;
}

interface VideoFormProps {
  initialData?: VideoFormData;
  initialLessonId?: string;
  lessonOptions: SelectOption[];
  submitLabel?: string;
  onSubmit: (
    data: VideoFormData,
  ) => Promise<void>;
}

export default function VideoForm({
  initialData,
  initialLessonId,
  lessonOptions,
  submitLabel = "Simpan",
  onSubmit,
}: VideoFormProps) {
  const [lessonId, setLessonId] = useState(
    initialData?.lesson_id ?? initialLessonId ?? "",
  );
  const [title, setTitle] = useState(
    initialData?.title ?? "",
  );
  const [provider, setProvider] =
    useState<SupportedVideoProvider>(
      initialData?.provider ?? "youtube",
    );
  const [sourceInput, setSourceInput] = useState(
    initialData
      ? getVideoSourceInput(
          initialData.provider,
          initialData.provider_video_id,
        )
      : "",
  );
  const [duration, setDuration] = useState(
    initialData?.duration ?? 0,
  );
  const [videoOrder, setVideoOrder] = useState(
    initialData?.video_order ?? 1,
  );
  const [publicationStatus, setPublicationStatus] =
    useState(
      initialData?.publication_status ?? "draft",
    );
  const [isRequired, setIsRequired] = useState(
    initialData?.is_required ?? true,
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const providerOptions = useMemo(() => {
    const options: SelectOption[] = [
      {
        value: "youtube",
        label: "YouTube",
      },
      {
        value: "google_drive",
        label: "Google Drive",
      },
    ];

    if (
      initialData?.provider &&
      initialData.provider !== "youtube" &&
      initialData.provider !== "google_drive"
    ) {
      options.push({
        value: initialData.provider,
        label: `${initialData.provider} (lama)`,
      });
    }

    return options;
  }, [initialData?.provider]);

  const sourceValidation = useMemo(() => {
    if (!sourceInput.trim()) {
      return {
        normalized: null,
        error: "",
      };
    }

    try {
      return {
        normalized: normalizeVideoSource(
          provider,
          sourceInput,
        ),
        error: "",
      };
    } catch (error) {
      return {
        normalized: null,
        error:
          error instanceof Error
            ? error.message
            : "Sumber video tidak valid.",
      };
    }
  }, [provider, sourceInput]);

  function handleProviderChange(value: string) {
    setProvider(value as SupportedVideoProvider);
    setSourceInput("");
    setErrorMessage("");
  }

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
      setErrorMessage("Judul video wajib diisi.");
      return;
    }

    if (!sourceValidation.normalized) {
      setErrorMessage(
        sourceValidation.error ||
          `${getVideoInputLabel(provider)} wajib diisi.`,
      );
      return;
    }

    if (
      !Number.isFinite(duration) ||
      duration < 0
    ) {
      setErrorMessage("Durasi video tidak valid.");
      return;
    }

    if (
      !Number.isInteger(videoOrder) ||
      videoOrder < 0
    ) {
      setErrorMessage(
        "Urutan video harus berupa bilangan bulat 0 atau lebih.",
      );
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        lesson_id: lessonId,
        title: title.trim(),
        provider,
        provider_video_id: sourceInput.trim(),
        duration,
        video_order: videoOrder,
        publication_status: publicationStatus,
        is_required: isRequired,
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

      <SelectField
        label="Provider Video"
        value={provider}
        options={providerOptions}
        onChange={handleProviderChange}
      />

      <div>
        <TextInput
          label={getVideoInputLabel(provider)}
          required
          value={sourceInput}
          onChange={setSourceInput}
        />

        <p className="mt-2 text-xs leading-5 text-gray-500">
          {getVideoInputHelp(provider)}
        </p>

        {sourceInput &&
          sourceValidation.error && (
            <p className="mt-2 text-sm text-red-600">
              {sourceValidation.error}
            </p>
          )}
      </div>

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
          label="Urutan Video"
          type="number"
          value={String(videoOrder)}
          onChange={(value) =>
            setVideoOrder(Number(value))
          }
        />
      </div>

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
        Video wajib dipelajari
      </label>

      {sourceValidation.normalized?.provider ===
        "youtube" && (
        <div className="overflow-hidden rounded-xl border bg-black">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${sourceValidation.normalized.providerVideoId}`}
              title="Preview video YouTube"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {sourceValidation.normalized?.provider ===
        "google_drive" && (
        <GoogleDrivePlayer
          fileId={
            sourceValidation.normalized
              .providerVideoId
          }
          title="Preview video Google Drive"
        />
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            loading ||
            !sourceValidation.normalized
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
