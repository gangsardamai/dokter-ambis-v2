"use server";

import { resolveUniversityOrigin } from "@/lib/university-options";
import { authService } from "@/services";

export interface RegisterActionInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  universityOrigin: string;
  universityOriginOther: string;
  nextPath?: string;
}

export interface RegisterActionResult {
  success: boolean;
  message: string;
  redirectTo?: string;
}

function getSafeStudentNextPath(value: string | undefined): string {
  const nextPath = value?.trim() ?? "";

  if (
    nextPath.startsWith("/dashboard/student/") &&
    !nextPath.startsWith("//")
  ) {
    return nextPath;
  }

  return "";
}

function getRegisterErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("password") && normalized.includes("6")) {
    return "Password minimal terdiri dari 6 karakter.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered")
  ) {
    return "Email tersebut sudah terdaftar. Silakan masuk atau gunakan email lain.";
  }

  if (
    normalized.includes("database error") ||
    normalized.includes("duplicate")
  ) {
    return "Pendaftaran gagal. Pastikan email dan nomor WhatsApp belum pernah digunakan.";
  }

  return "Pendaftaran belum berhasil. Periksa kembali data Anda dan coba lagi.";
}

export async function registerAction(
  data: RegisterActionInput,
): Promise<RegisterActionResult> {
  const fullName = data.fullName.trim();
  const phone = data.phone.trim();
  const email = data.email.trim();
  const universityOrigin = resolveUniversityOrigin(
    data.universityOrigin,
    data.universityOriginOther,
  );
  const nextPath = getSafeStudentNextPath(data.nextPath);

  if (!fullName || !phone || !email || !data.password) {
    return {
      success: false,
      message: "Nama, email, nomor WhatsApp, dan password wajib diisi.",
    };
  }

  if (!universityOrigin) {
    return {
      success: false,
      message: "Silakan pilih atau tuliskan universitas asal Anda.",
    };
  }

  if (data.password.length < 6) {
    return {
      success: false,
      message: "Password minimal terdiri dari 6 karakter.",
    };
  }

  const result = await authService.register({
    fullName,
    phone,
    email,
    password: data.password,
    universityOrigin,
    nextPath,
  });

  if (result.error) {
    return {
      success: false,
      message: getRegisterErrorMessage(result.error.message),
    };
  }

  if (!result.data.user) {
    return {
      success: false,
      message: "Akun belum berhasil dibuat. Silakan coba kembali.",
    };
  }

  const params = new URLSearchParams({
    registered: "check-email",
  });

  if (nextPath) {
    params.set("next", nextPath);
  }

  return {
    success: true,
    message:
      "Pendaftaran berhasil. Silakan periksa email Anda untuk melakukan konfirmasi.",
    redirectTo: `/login?${params.toString()}`,
  };
}
