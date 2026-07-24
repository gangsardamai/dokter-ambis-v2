"use server";

import {
  revalidatePath,
} from "next/cache";
import {
  redirect,
} from "next/navigation";

import {
  normalizeVideoSource,
  type VideoFormPayload,
} from "@/lib/video/video-source";
import {
  videoService,
} from "@/services";
import type { Database } from "@/supabase/types/database.types";

type VideoInsert =
  Database["public"]["Tables"]["videos"]["Insert"];

type VideoUpdate =
  Database["public"]["Tables"]["videos"]["Update"];

function validateVideoPayload(
  data: VideoFormPayload,
): void {
  if (!data.lesson_id.trim()) {
    throw new Error("Materi wajib dipilih.");
  }

  if (!data.title.trim()) {
    throw new Error("Judul video wajib diisi.");
  }

  if (
    !Number.isFinite(data.duration) ||
    data.duration < 0
  ) {
    throw new Error("Durasi video tidak valid.");
  }

  if (
    !Number.isInteger(data.video_order) ||
    data.video_order < 0
  ) {
    throw new Error(
      "Urutan video harus berupa bilangan bulat 0 atau lebih.",
    );
  }
}

function normalizeVideoPayload(
  data: VideoFormPayload,
): VideoInsert {
  validateVideoPayload(data);

  const source = normalizeVideoSource(
    data.provider,
    data.provider_video_id,
  );

  return {
    lesson_id: data.lesson_id.trim(),
    title: data.title.trim(),
    provider:
      source.provider as VideoInsert["provider"],
    provider_video_id: source.providerVideoId,
    duration: data.duration,
    video_order: data.video_order,
    publication_status: data.publication_status,
    is_required: data.is_required,
  };
}

export async function createVideoAction(
  data: VideoFormPayload,
) {
  const video =
    await videoService.createVideo(
      normalizeVideoPayload(data),
    );

  revalidatePath(
    "/dashboard/admin/video",
  );
  revalidatePath(
    `/dashboard/admin/video/${video.id}`,
  );

  redirect(
    `/dashboard/admin/video/${video.id}`,
  );
}

export async function updateVideoAction(
  id: string,
  data: VideoFormPayload,
) {
  const normalized =
    normalizeVideoPayload(data);

  const updateData: VideoUpdate = {
    lesson_id: normalized.lesson_id,
    title: normalized.title,
    provider: normalized.provider,
    provider_video_id:
      normalized.provider_video_id,
    duration: normalized.duration,
    video_order: normalized.video_order,
    publication_status:
      normalized.publication_status,
    is_required: normalized.is_required,
  };

  await videoService.updateVideo(
    id,
    updateData,
  );

  revalidatePath(
    "/dashboard/admin/video",
  );
  revalidatePath(
    `/dashboard/admin/video/${id}`,
  );
  revalidatePath(
    `/dashboard/admin/video/${id}/edit`,
  );

  redirect(
    `/dashboard/admin/video/${id}`,
  );
}

export async function deleteVideoAction(
  id: string,
) {
  await videoService.deleteVideo(id);

  revalidatePath(
    "/dashboard/admin/video",
  );

  redirect(
    "/dashboard/admin/video",
  );
}
