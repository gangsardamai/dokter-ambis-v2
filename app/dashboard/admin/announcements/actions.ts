"use server";

import { revalidatePath } from "next/cache";

import { failure, success } from "@/lib/actions/result";
import {
  announcementService,
  profileService,
} from "@/services";

import type { AnnouncementWriteInput } from "@/services/announcement.service";
import type { ActionResult } from "@/types/action-result";

function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function getStringList(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function jakartaDateTimeToIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withSeconds = trimmed.length === 16
    ? `${trimmed}:00`
    : trimmed;

  const parsed = new Date(`${withSeconds}+07:00`);
  if (Number.isNaN(parsed.getTime())) return trimmed;
  return parsed.toISOString();
}

function mapAnnouncementForm(
  formData: FormData,
): AnnouncementWriteInput {
  const startValue = getString(formData, "starts_at");
  const endValue = getString(formData, "ends_at");

  return {
    title: getString(formData, "title"),
    content: getString(formData, "content"),
    allStudents: formData.get("all_students") === "on",
    isPublished: formData.get("is_published") === "on",
    startsAt: jakartaDateTimeToIso(startValue),
    endsAt: endValue
      ? jakartaDateTimeToIso(endValue)
      : null,
    showOnDashboard:
      formData.get("show_on_dashboard") === "on",
    organizationIds: getStringList(
      formData,
      "organization_ids",
    ),
    courseIds: getStringList(formData, "course_ids"),
  };
}

async function requireAdminProfile() {
  const profile = await profileService.getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    throw new Error("Akses admin diperlukan.");
  }

  return profile;
}

export async function createAnnouncementAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireAdminProfile();

    await announcementService.create(
      profile.id,
      mapAnnouncementForm(formData),
    );

    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard/student");

    return success("Pengumuman berhasil dibuat.");
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Pengumuman gagal dibuat.",
    );
  }
}

export async function updateAnnouncementAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdminProfile();

    await announcementService.update(
      id,
      mapAnnouncementForm(formData),
    );

    revalidatePath("/dashboard/admin/announcements");
    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/student/announcements");

    return success("Pengumuman berhasil diperbarui.");
  } catch (error) {
    return failure(
      error instanceof Error
        ? error.message
        : "Pengumuman gagal diperbarui.",
    );
  }
}

export async function moveAnnouncementAction(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  await requireAdminProfile();
  await announcementService.move(id, direction);

  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/dashboard/student");
}

export async function deleteAnnouncementAction(
  id: string,
): Promise<void> {
  await requireAdminProfile();
  await announcementService.delete(id);

  revalidatePath("/dashboard/admin/announcements");
  revalidatePath("/dashboard/student");
  revalidatePath("/dashboard/student/announcements");
}
