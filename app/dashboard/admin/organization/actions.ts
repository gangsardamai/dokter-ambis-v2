"use server";

import { revalidatePath } from "next/cache";

import { organizationService } from "@/services";

import { validateOrganization } from "@/lib/validators/organization";

import {
  success,
  failure,
} from "@/lib/actions/result";

import type { ActionResult } from "@/types/action-result";

import type { Database } from "@/supabase/types/database.types";

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

export async function createOrganizationAction(
  data: OrganizationInsert
): Promise<ActionResult> {

  const validation =
    validateOrganization({

      title: data.title,

      short_name: data.short_name,

      slug: data.slug,

    });

  if (!validation.valid) {

    return failure(
      validation.message!
    );

  }

  await organizationService.createOrganization(
    data
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );

  return success(
    "Organization berhasil dibuat."
  );

}

export async function updateOrganizationAction(
  id: string,
  data: OrganizationUpdate
): Promise<ActionResult> {

  const validation =
    validateOrganization({

      title:
        data.title ?? "",

      short_name:
        data.short_name ?? "",

      slug:
        data.slug ?? "",

    });

  if (!validation.valid) {

    return failure(
      validation.message!
    );

  }

  await organizationService.updateOrganization(
    id,
    data
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );

  return success(
    "Organization berhasil diupdate."
  );

}

export async function deleteOrganizationAction(
  id: string
): Promise<ActionResult> {

  await organizationService.deleteOrganization(
    id
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );

  return success(
    "Organization berhasil dihapus."
  );

}

export async function activateOrganizationAction(
  id: string
): Promise<ActionResult> {

  await organizationService.activateOrganization(
    id
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );

  return success(
    "Organization berhasil diaktifkan."
  );

}

export async function deactivateOrganizationAction(
  id: string
): Promise<ActionResult> {

  await organizationService.deactivateOrganization(
    id
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );

  return success(
    "Organization berhasil dinonaktifkan."
  );

}