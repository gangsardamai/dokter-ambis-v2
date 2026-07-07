"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { programService } from "@/services";

import type { Database } from "@/supabase/types/database.types";

type ProgramInsert =
  Database["public"]["Tables"]["programs"]["Insert"];

type ProgramUpdate =
  Database["public"]["Tables"]["programs"]["Update"];

function validateProgram(
  data: {
    title?: string | null;
    slug?: string | null;
  }
) {

  const title =
    data.title?.trim() ?? "";

  const slug =
    data.slug?.trim() ?? "";

  if (!title) {
    throw new Error(
      "Nama program wajib diisi."
    );
  }

  if (!slug) {
    throw new Error(
      "Slug wajib diisi."
    );
  }

  return {
    title,
    slug,
  };

}

/* ========================================
   CREATE
======================================== */

export async function createProgramAction(
  data: ProgramInsert
) {

  const validated =
    validateProgram(data);

  await programService.createProgram({
    ...data,
    title: validated.title,
    slug: validated.slug,
  });

  revalidatePath(
    "/dashboard/admin/program"
  );

  redirect(
    "/dashboard/admin/program"
  );

}

/* ========================================
   UPDATE
======================================== */

export async function updateProgramAction(
  id: string,
  data: ProgramUpdate
) {

  const validated =
    validateProgram(data);

  await programService.updateProgram(
    id,
    {
      ...data,
      title: validated.title,
      slug: validated.slug,
    }
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

  redirect(
    "/dashboard/admin/program"
  );

}

/* ========================================
   ACTIVATE
======================================== */

export async function activateProgramAction(
  id: string
) {

  await programService.activateProgram(
    id
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

}

/* ========================================
   DEACTIVATE
======================================== */

export async function deactivateProgramAction(
  id: string
) {

  await programService.deactivateProgram(
    id
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

}

/* ========================================
   DELETE
======================================== */

export async function deleteProgramAction(
  id: string
) {

  await programService.deleteProgram(
    id
  );

  revalidatePath(
    "/dashboard/admin/program"
  );

}