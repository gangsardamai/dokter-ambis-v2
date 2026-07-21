"use server";

import { revalidatePath } from "next/cache";

import { programService } from "@/services";

import { validateProgram } from "@/lib/validators/program";

import {
  success,
  failure,
} from "@/lib/actions/result";

import type { ActionResult } from "@/types/action-result";

import type { Database } from "@/supabase/types/database.types";

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

type ProgramUpdate =
  Database["public"]["Tables"]["programs"]["Update"];

/* ========================================
   CREATE
======================================== */

export async function createProgramAction(
  data: ProgramInsert
): Promise<ActionResult> {

  const validation =
    validateProgram({
      title: data.title,
      slug: data.slug,
    });

  if (!validation.valid) {

    return failure(
      validation.message!
    );

  }

  await programService.createProgram(
    data
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

  return success(
    "Program berhasil dibuat."
  );

}

/* ========================================
   UPDATE
======================================== */

export async function updateProgramAction(
  id: string,
  data: ProgramUpdate
): Promise<ActionResult> {

  const validation =
    validateProgram({
      title: data.title ?? "",
      slug: data.slug ?? "",
    });

  if (!validation.valid) {

    return failure(
      validation.message!
    );

  }

  await programService.updateProgram(
    id,
    data
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

  return success(
    "Program berhasil diupdate."
  );

}

/* ========================================
   ACTIVATE
======================================== */

export async function activateProgramAction(
  id: string
): Promise<ActionResult> {

  await programService.activateProgram(
    id
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

  return success(
    "Program berhasil diaktifkan."
  );

}

/* ========================================
   DEACTIVATE
======================================== */

export async function deactivateProgramAction(
  id: string
): Promise<ActionResult> {

  await programService.deactivateProgram(
    id
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

  return success(
    "Program berhasil dinonaktifkan."
  );

}

/* ========================================
   DELETE
======================================== */

export async function deleteProgramAction(
  id: string
): Promise<ActionResult> {

  await programService.deleteProgram(
    id
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

  return success(
    "Program berhasil dihapus."
  );

}