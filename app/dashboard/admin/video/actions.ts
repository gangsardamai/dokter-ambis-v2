"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  videoService,
} from "@/services";

import type { Database } from "@/supabase/types/database.types";

type VideoInsert =
  Database["public"]["Tables"]["videos"]["Insert"];

type VideoUpdate =
  Database["public"]["Tables"]["videos"]["Update"];

function extractYoutubeVideoId(
  value: string,
): string {
  const input =
    value.trim();

  if (
    /^[a-zA-Z0-9_-]{11}$/.test(
      input,
    )
  ) {
    return input;
  }

  try {
    const url =
      new URL(input);

    const hostname =
      url.hostname
        .replace(/^www\./, "")
        .toLowerCase();

    if (hostname === "youtu.be") {
      const id =
        url.pathname
          .split("/")
          .filter(Boolean)[0];

      if (
        id &&
        /^[a-zA-Z0-9_-]{11}$/.test(id)
      ) {
        return id;
      }
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

        if (
          id &&
          /^[a-zA-Z0-9_-]{11}$/.test(id)
        ) {
          return id;
        }
      }
    }
  } catch {
    /*
     * Error URL diproses di bawah.
     */
  }

  throw new Error(
    "URL YouTube tidak valid.",
  );
}

export async function createVideoAction(
  data: VideoInsert,
) {
  const video =
    await videoService.createVideo({
      ...data,
      provider:
        "youtube",
      provider_video_id:
        extractYoutubeVideoId(
          data.provider_video_id,
        ),
    });

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
  data: VideoUpdate,
) {
  const normalizedData:
    VideoUpdate = {
      ...data,
      provider:
        "youtube",
    };

  if (data.provider_video_id) {
    normalizedData.provider_video_id =
      extractYoutubeVideoId(
        data.provider_video_id,
      );
  }

  await videoService.updateVideo(
    id,
    normalizedData,
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
  await videoService.deleteVideo(
    id,
  );

  revalidatePath(
    "/dashboard/admin/video",
  );

  redirect(
    "/dashboard/admin/video",
  );
}