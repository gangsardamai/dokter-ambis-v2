"use server";

import { revalidatePath } from "next/cache";

import { liveClassService } from "@/services";

import type { Database } from "@/supabase/types/database.types";

type LiveClassInsert =
  Database["public"]["Tables"]["live_classes"]["Insert"];

type LiveClassUpdate =
  Database["public"]["Tables"]["live_classes"]["Update"];

export async function createLiveClassAction(
  data: LiveClassInsert
) {

  await liveClassService.createLiveClass(
    data
  );

  revalidatePath(
    "/dashboard/admin/live-class"
  );

}

export async function updateLiveClassAction(
  id: string,
  data: LiveClassUpdate
) {

  await liveClassService.updateLiveClass(
    id,
    data
  );

  revalidatePath(
    "/dashboard/admin/live-class"
  );

  revalidatePath(
    `/dashboard/admin/live-class/${id}`
  );

}

export async function deleteLiveClassAction(
  id: string
) {

  await liveClassService.deleteLiveClass(
    id
  );

  revalidatePath(
    "/dashboard/admin/live-class"
  );

}