"use client";

import {
  useEffect,
  useMemo,
  useRef,
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

type DurationStatus =
  | "idle"
  | "loading"
  | "ready"
  | "error";

type YoutubePlayer = {
  destroy: () => void;
  getDuration: () => number;
};

type YoutubeWindow = Window & {
  YT?: {
    Player: new (
      element: HTMLElement,
      options: {
        videoId: string;
        playerVars?: Record<string, number>;
        events?: {
          onReady?: (event: {
            target: YoutubePlayer;
          }) => void;
          onError?: () => void;
        };
      },
    ) => YoutubePlayer;
  };
  onYouTubeIframeAPIReady?: () => void;
};

interface SelectOption {
  value: string;
  label: string;
}

interface VideoFormProps {
  initialData?: VideoFormData;
  initialLessonId?: string;
  lessonOptions: SelectOption[];
  submitLabel?: string;
  showVideoOrder?: boolean;
  showDuration?: boolean;
  onSubmit: (
    data: VideoFormData,
  ) => Promise<void>;
}

function secondsToMinutes(seconds: number) {
  return Math.max(
    1,
    Math.ceil(seconds / 60),
  );
}

export default function VideoForm({
  initialData,
  initialLessonId,
  lessonOptions,
  submitLabel = "Simpan",
  showVideoOrder = true,
  showDuration = true,
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
  const [durationStatus, setDurationStatus] =
    useState<DurationStatus>(
      initialData?.duration
        ? "ready"
        : "idle",
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
  const youtubeDurationRef =
    useRef<HTMLDivElement | null>(null);

  const providerOptions: SelectOption[] = [
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
    providerOptions.push({
      value: initialData.provider,
      label: `${initialData.provider} (lama)`,
    });
  }

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

  const normalizedProvider =
    sourceValidation.normalized?.provider;
  const normalizedProviderVideoId =
    sourceValidation.normalized?.providerVideoId;

  useEffect(() => {
    if (showDuration) {
      return;
    }

    if (
      !normalizedProvider ||
      !normalizedProviderVideoId
    ) {
      setDuration(0);
      setDurationStatus("idle");
      return;
    }

    setDuration(0);
    setDurationStatus("loading");

    if (normalizedProvider !== "youtube") {
      if (normalizedProvider !== "google_drive") {
        setDurationStatus("error");
      }
      return;
    }

    let cancelled = false;
    let player: YoutubePlayer | null = null;

    const youtubeWindow =
      window as YoutubeWindow;

    const initializePlayer = () => {
      if (
        cancelled ||
        !youtubeWindow.YT?.Player ||
        !youtubeDurationRef.current
      ) {
        return;
      }

      player?.destroy();

      player = new youtubeWindow.YT.Player(
        youtubeDurationRef.current,
        {
          videoId: normalizedProviderVideoId,
          playerVars: {
            controls: 0,
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                return;
              }

              const seconds =
                event.target.getDuration();

              if (
                Number.isFinite(seconds) &&
                seconds > 0
              ) {
                setDuration(
                  secondsToMinutes(seconds),
                );
                setDurationStatus("ready");
              } else {
                setDurationStatus("error");
              }
            },
            onError: () => {
              if (!cancelled) {
                setDurationStatus("error");
              }
            },
          },
        },
      );
    };

    if (youtubeWindow.YT?.Player) {
      initializePlayer();
    } else {
      const previousReady =
        youtubeWindow.onYouTubeIframeAPIReady;

      youtubeWindow.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        initializePlayer();
      };

      if (
        !document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]',
        )
      ) {
        const script =
          document.createElement("script");
        script.src =
          "https://www.youtube.com/iframe_api";
        script.async = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [
    normalizedProvider,
    normalizedProviderVideoId,
    showDuration,
  ]);

  function handleProviderChange(value: string) {
    setProvider(value as SupportedVideoProvider);
    setSourceInput("");
    setDuration(0);
    setDurationStatus("idle");
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
      duration <= 0
    ) {
      setErrorMessage(
        showDuration
          ? "Durasi video wajib lebih dari 0 menit."
          : "Durasi video belum berhasil dideteksi otomatis. Pastikan video dapat diakses lalu coba lagi.",
      );
      return;
    }

    if (
      showVideoOrder &&
      (!Number.isInteger(videoOrder) ||
        videoOrder < 0)
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

      {showDuration ? (
        <div
          className={
            showVideoOrder
              ? "grid gap-5 sm:grid-cols-2"
              : undefined
          }
        >
          <TextInput
            label="Durasi (menit)"
            type="number"
            required
            value={String(duration)}
            onChange={(value) =>
              setDuration(Number(value))
            }
          />

          {showVideoOrder && (
            <TextInput
              label="Urutan Video"
              type="number"
              value={String(videoOrder)}
              onChange={(value) =>
                setVideoOrder(Number(value))
              }
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {durationStatus === "idle" &&
            "Durasi akan terdeteksi otomatis setelah URL video dimasukkan."}
          {durationStatus === "loading" &&
            "Mendeteksi durasi video secara otomatis..."}
          {durationStatus === "ready" &&
            `Durasi terdeteksi otomatis: ${duration} menit.`}
          {durationStatus === "error" &&
            "Durasi belum dapat dideteksi otomatis. Pastikan video dapat diakses dan URL benar."}
        </div>
      )}

      {!showDuration &&
        normalizedProvider === "youtube" && (
          <div
            ref={youtubeDurationRef}
            className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
            aria-hidden="true"
          />
        )}

      {!showDuration &&
        normalizedProvider === "google_drive" &&
        normalizedProviderVideoId && (
          <video
            key={normalizedProviderVideoId}
            className="hidden"
            preload="metadata"
            src={`https://drive.google.com/uc?export=download&id=${normalizedProviderVideoId}`}
            onLoadedMetadata={(event) => {
              const seconds =
                event.currentTarget.duration;

              if (
                Number.isFinite(seconds) &&
                seconds > 0
              ) {
                setDuration(
                  secondsToMinutes(seconds),
                );
                setDurationStatus("ready");
              } else {
                setDurationStatus("error");
              }
            }}
            onError={() =>
              setDurationStatus("error")
            }
          />
        )}

      {showDuration && showVideoOrder && null}

      {!showDuration && showVideoOrder && (
        <TextInput
          label="Urutan Video"
          type="number"
          value={String(videoOrder)}
          onChange={(value) =>
            setVideoOrder(Number(value))
          }
        />
      )}

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
            !sourceValidation.normalized ||
            (!showDuration &&
              durationStatus !== "ready")
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
