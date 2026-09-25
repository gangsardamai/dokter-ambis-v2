"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  LEADER_PERMISSIONS,
  type LeaderPermission,
} from "@/lib/leader-access";
import { adminStudentService, leaderAccessService, profileService } from "@/services";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function finish(feedback: string): never {
  revalidatePath("/dashboard/admin/leader");
  redirect(`/dashboard/admin/leader?feedback=${encodeURIComponent(feedback)}`);
}

export async function promoteLeaderAction(formData: FormData) {
  const phone = value(formData, "phone");
  if (!phone) throw new Error("Nomor WhatsApp wajib diisi.");

  await leaderAccessService.promoteStudentByPhone(phone);
  finish("leader-created");
}

export async function setLeaderPasswordAction(formData: FormData) {
  const profile = await profileService.getCurrentProfile();
  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new Error("Anda tidak memiliki izin sebagai admin.");
  }

  const leaderId = value(formData, "leader_id");
  const newPassword = String(formData.get("new_password") ?? "");

  if (!leaderId) throw new Error("Akun Leader tidak ditemukan.");
  if (newPassword.trim().length < 6) {
    throw new Error("Password baru minimal 6 karakter.");
  }

  await adminStudentService.setStudentPassword(leaderId, newPassword);
  finish("password-updated");
}

export async function setLeaderStatusAction(formData: FormData) {
  const leaderId = value(formData, "leader_id");
  const status = value(formData, "status");

  if (status !== "active" && status !== "inactive") {
    throw new Error("Status Leader tidak valid.");
  }

  await leaderAccessService.setLeaderStatus(leaderId, status);
  finish(status === "active" ? "leader-activated" : "leader-deactivated");
}

export async function setLeaderPermissionsAction(formData: FormData) {
  const leaderId = value(formData, "leader_id");
  const permissions = LEADER_PERMISSIONS.filter(
    (permission) => formData.get(permission) === "on",
  ) as LeaderPermission[];

  await leaderAccessService.setPermissions(leaderId, permissions);
  finish("permissions-updated");
}

export async function addLeaderScopeAction(formData: FormData) {
  const leaderId = value(formData, "leader_id");
  const scopeType = value(formData, "scope_type");
  const scopeId = value(formData, "scope_id");

  if (
    scopeType !== "organization" &&
    scopeType !== "program" &&
    scopeType !== "course"
  ) {
    throw new Error("Jenis scope tidak valid.");
  }

  await leaderAccessService.addScope(leaderId, scopeType, scopeId);
  finish("scope-added");
}

export async function removeLeaderScopeAction(formData: FormData) {
  await leaderAccessService.removeScope(value(formData, "scope_id"));
  finish("scope-removed");
}
