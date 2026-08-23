"use server";

import { revalidatePath } from "next/cache";

import { adminStudentService, profileService } from "@/services";

interface AdminStudentActionResult {
  success: boolean;
  message: string;
}

async function ensureActiveAdmin(): Promise<void> {
  const profile = await profileService.getCurrentProfile();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new Error("Anda tidak memiliki izin sebagai admin.");
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function revalidateStudentPages(profileId: string): void {
  revalidatePath("/dashboard/admin/student");
  revalidatePath(`/dashboard/admin/student/${profileId}`);
  revalidatePath("/dashboard/admin");
}

export async function resetStudentDevicesAction(
  profileId: string,
): Promise<AdminStudentActionResult> {
  try {
    await ensureActiveAdmin();
    const deletedCount = await adminStudentService.resetStudentDevices(profileId);

    revalidateStudentPages(profileId);

    return {
      success: true,
      message:
        deletedCount > 0
          ? `${deletedCount} perangkat berhasil di-reset. Peserta dapat mendaftarkan perangkat kembali saat login.`
          : "Tidak ada perangkat aktif yang tersimpan. Akun tetap siap digunakan.",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Reset device gagal dilakukan."),
    };
  }
}

export async function setStudentPasswordAction(
  profileId: string,
  newPassword: string,
): Promise<AdminStudentActionResult> {
  try {
    await ensureActiveAdmin();
    await adminStudentService.setStudentPassword(profileId, newPassword);

    revalidateStudentPages(profileId);

    return {
      success: true,
      message: "Password baru berhasil dipasang.",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Password mahasiswa gagal diubah."),
    };
  }
}

export async function promoteStudentToMentorAction(
  profileId: string,
): Promise<AdminStudentActionResult> {
  try {
    await ensureActiveAdmin();
    await adminStudentService.promoteStudentToMentor(profileId);

    revalidateStudentPages(profileId);
    revalidatePath("/dashboard/mentor");

    return {
      success: true,
      message: "Akun berhasil dijadikan mentor.",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Akun mahasiswa gagal dijadikan mentor."),
    };
  }
}

export async function deleteStudentAccountAction(
  profileId: string,
  confirmationEmail: string,
): Promise<AdminStudentActionResult> {
  try {
    await ensureActiveAdmin();
    await adminStudentService.deleteStudentAccount(
      profileId,
      confirmationEmail,
    );

    revalidateStudentPages(profileId);
    revalidatePath("/dashboard/admin/enrollment");

    return {
      success: true,
      message: "Akun mahasiswa dan seluruh riwayatnya berhasil dihapus permanen.",
    };
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error, "Akun mahasiswa gagal dihapus."),
    };
  }
}
