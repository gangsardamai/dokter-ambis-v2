"use server";

import { cookies, headers } from "next/headers";

import { resolveUniversityOrigin } from "@/lib/university-options";
import {
  authService,
  deviceService,
  profileService,
} from "@/services";
import type { Database } from "@/supabase/types/database.types";

type DeviceType = Database["public"]["Enums"]["device_type"];

export interface RegisterActionInput {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  universityOrigin: string;
  universityOriginOther: string;
  nextPath?: string;
  deviceIdentifier?: string;
  deviceName?: string;
  deviceType?: DeviceType;
}

export interface RegisterActionResult {
  success: boolean;
  message: string;
  redirectTo?: string;
}

const DEVICE_COOKIE_NAME = "dokter_ambis_device_identifier";
const VALID_DEVICE_TYPES: DeviceType[] = [
  "desktop",
  "laptop",
  "tablet",
  "mobile",
];

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

function parseDeviceType(value: DeviceType | undefined): DeviceType {
  if (value && VALID_DEVICE_TYPES.includes(value)) {
    return value;
  }

  return "desktop";
}

function getIpAddress(
  forwardedFor: string | null,
  realIp: string | null,
): string | null {
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return realIp;
}

function getLoginFallbackPath(message: string, nextPath: string): string {
  const params = new URLSearchParams({ error: message });

  if (nextPath) {
    params.set("next", nextPath);
  }

  return `/login?${params.toString()}`;
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

  if (result.data.session) {
    const profile = await profileService.getCurrentProfile();

    if (
      !profile ||
      profile.role !== "student" ||
      profile.status !== "active"
    ) {
      await authService.logout();

      return {
        success: true,
        message: "Akun berhasil dibuat. Silakan masuk untuk melanjutkan.",
        redirectTo: getLoginFallbackPath(
          "Akun berhasil dibuat. Silakan masuk untuk melanjutkan.",
          nextPath,
        ),
      };
    }

    const cookieStore = await cookies();
    const requestHeaders = await headers();
    const savedDeviceIdentifier = cookieStore.get(
      DEVICE_COOKIE_NAME,
    )?.value;
    const deviceIdentifier =
      savedDeviceIdentifier || data.deviceIdentifier?.trim() || "";

    try {
      await deviceService.registerOrRefreshStudentDevice({
        profileId: profile.id,
        deviceIdentifier,
        deviceName: data.deviceName?.trim() || "Perangkat peserta",
        deviceType: parseDeviceType(data.deviceType),
        userAgent: requestHeaders.get("user-agent"),
        ipAddress: getIpAddress(
          requestHeaders.get("x-forwarded-for"),
          requestHeaders.get("x-real-ip"),
        ),
      });
    } catch (error) {
      await authService.logout();

      const message =
        error instanceof Error
          ? error.message
          : "Perangkat belum dapat didaftarkan.";

      return {
        success: true,
        message: "Akun berhasil dibuat. Silakan masuk untuk melanjutkan.",
        redirectTo: getLoginFallbackPath(message, nextPath),
      };
    }

    cookieStore.set(DEVICE_COOKIE_NAME, deviceIdentifier, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return {
      success: true,
      message: "Akun berhasil dibuat.",
      redirectTo: nextPath || "/dashboard/student",
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
