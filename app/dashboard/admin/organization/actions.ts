"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { organizationService } from "@/services";

import type { Database } from "@/supabase/types/database.types";

type OrganizationInsert =
  Database["public"]["Tables"]["organizations"]["Insert"];

type OrganizationUpdate =
  Database["public"]["Tables"]["organizations"]["Update"];

/* ========================================
   CREATE
======================================== */

export async function createOrganizationAction(
  data: OrganizationInsert
) {
  await organizationService.createOrganization(
    data
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );

  redirect(
    "/dashboard/admin/organization"
  );
}

/* ========================================
   UPDATE
======================================== */

export async function updateOrganizationAction(
  id: string,
  data: OrganizationUpdate
) {
  await organizationService.updateOrganization(
    id,
    data
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );

  redirect(
    "/dashboard/admin/organization"
  );
}

/* ========================================
   ACTIVATE
======================================== */

export async function activateOrganizationAction(
  id: string
) {
  await organizationService.activateOrganization(
    id
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );
}

/* ========================================
   DEACTIVATE
======================================== */

export async function deactivateOrganizationAction(
  id: string
) {
  await organizationService.deactivateOrganization(
    id
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );
}

/* ========================================
   DELETE
======================================== */

export async function deleteOrganizationAction(
  id: string
) {
  await organizationService.deleteOrganization(
    id
  );

  revalidatePath(
    "/dashboard/admin/organization"
  );
}