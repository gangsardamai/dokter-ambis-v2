"use server";

import { revalidatePath } from "next/cache";

import {
  courseCommunityLinkService,
  courseService,
  leaderAccessService,
  organizationService,
  paymentAccountService,
} from "@/services";

import { validateCourse } from "@/lib/validators/course.validator";

import {
  success,
  failure,
} from "@/lib/actions/result";

import type { ActionResult } from "@/types/action-result";
import type { Database } from "@/supabase/types/database.extended.types";

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];
type CourseUpdate =
  Database["public"]["Tables"]["courses"]["Update"];

export async function createCourseAction(
  data: CourseInsert,
  whatsappGroupUrl = "",
  requestedRegistrationSlug = "",
): Promise<ActionResult> {
  await leaderAccessService.requireStaffPermission("manage_master_data");


  const validation = validateCourse({
    title: data.title,
    slug: data.slug,
    organization_id: data.organization_id,
    program_id: data.program_id,
    price: Number(data.price),
  });

  if (!validation.valid) {
    return failure(validation.message!);
  }

  try {
    await paymentAccountService.requireActiveAccount(
      data.payment_account_id ?? "",
    );

    const normalizedWhatsAppGroupUrl =
      courseCommunityLinkService.normalizeWhatsAppGroupUrl(
        whatsappGroupUrl,
      );

    await courseService.createCourse(
      data,
      normalizedWhatsAppGroupUrl,
      requestedRegistrationSlug,
    );
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Course gagal dibuat.");
  }

  revalidatePath("/dashboard/admin/course");

  return success("Course berhasil dibuat.");
}

export interface CourseRegistrationPreviewResult {
  success: boolean;
  message: string;
  registrationUrl?: string;
  courseSlug?: string;
}

export async function generateCourseRegistrationLinkAction(
  organizationId: string,
  title: string,
): Promise<CourseRegistrationPreviewResult> {
  await leaderAccessService.requireStaffPermission("manage_master_data");

  const normalizedTitle = title.trim();
  const normalizedOrganizationId = organizationId.trim();

  if (!normalizedTitle) {
    return {
      success: false,
      message: "Nama Blok wajib diisi terlebih dahulu.",
    };
  }

  if (!normalizedOrganizationId) {
    return {
      success: false,
      message: "Pilih Organization terlebih dahulu.",
    };
  }

  try {
    const organization =
      await organizationService.getOrganizationById(
        normalizedOrganizationId,
      );

    if (!organization) {
      return {
        success: false,
        message:
          "Organization tidak ditemukan atau berada di luar scope Anda.",
      };
    }

    const courseSlug =
      await courseService.getRegistrationSlugPreview(
        organization.id,
        normalizedTitle,
      );

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "https://dokterambis.com"
    ).replace(/\/+$/, "");

    return {
      success: true,
      message: "Preview link berhasil dibuat.",
      registrationUrl:
        `${siteUrl}/daftar/${organization.slug}/${courseSlug}`,
      courseSlug,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Link pendaftaran gagal dibuat.",
    };
  }
}

export async function updateCourseAction(
  id: string,
  data: CourseUpdate
): Promise<ActionResult> {
  await leaderAccessService.requireStaffPermission("manage_master_data");


  const validation = validateCourse({
    title: data.title ?? "",
    slug: data.slug ?? "",
    organization_id: data.organization_id ?? "",
    program_id: data.program_id ?? "",
    price: Number(data.price ?? 0),
  });

  if (!validation.valid) {
    return failure(validation.message!);
  }

  try {
    await paymentAccountService.requireActiveAccount(
      data.payment_account_id ?? "",
    );
    await courseService.updateCourse(
      id,
      data
    );
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Course gagal diperbarui.");
  }

  revalidatePath("/dashboard/admin/course");

  return success("Course berhasil diperbarui.");
}

export async function deleteCourseAction(
  id: string
): Promise<ActionResult> {

  await leaderAccessService.requireAdmin();
  await courseService.deleteCourse(id);

  revalidatePath("/dashboard/admin/course");

  return success("Course berhasil dihapus.");
}
export async function deleteCourseFormAction(
  formData: FormData
): Promise<void> {

  const id = formData.get("id") as string;

  await deleteCourseAction(id);

}