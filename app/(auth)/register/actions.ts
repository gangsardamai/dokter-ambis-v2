"use server";

import { authService } from "@/services";

export interface RegisterActionInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

export interface RegisterActionResult {
  success: boolean;
  message: string;
}

function getRegisterErrorMessage(
  message: string,
): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("password") &&
    normalized.includes("6")
  ) {
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
  const result = await authService.register({
    fullName: data.fullName,
    phone: data.phone,
    email: data.email,
    password: data.password,
  });

  if (result.error) {
    return {
      success: false,
      message: getRegisterErrorMessage(
        result.error.message,
      ),
    };
  }

  if (!result.data.user) {
    return {
      success: false,
      message: "Akun belum berhasil dibuat. Silakan coba kembali.",
    };
  }

  return {
    success: true,
    message: "Pendaftaran berhasil. Silakan konfirmasi email Anda.",
  };
}