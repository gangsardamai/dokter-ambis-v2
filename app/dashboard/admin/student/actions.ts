"use server";

import { revalidatePath } from "next/cache";

import { adminStudentService, profileService } from "@/services";

async function ensureActiveAdmin(): Promise<void> {
  const profile = await profileService.getCurrentProfile();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    throw new Error("Anda tidak memiliki izin sebagai admin.");
  }
}

export async function deleteStudentAccountAction(
  profileId: string,
  confirmationEmail: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    await ensureActiveAdmin();
    await adminStudentService.deleteStudentAccount(
      profileId,
      confirmationEmail,
    );

    revalidatePath("/dashboard/admin/student");
    revalidatePath(`/dashboard/admin/student/${profileId}`);
    revalidatePath("/dashboard/admin/enrollment");
    revalidatePath("/dashboard/admin");

    return {
      success: true,
      message: "Akun mahasiswa dan seluruh riwayatnya berhasil dihapus permanen.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Akun mahasiswa gagal dihapus.",
    };
  }
}
