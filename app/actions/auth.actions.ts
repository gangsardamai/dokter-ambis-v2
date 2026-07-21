"use server";

import {
  cookies,
  headers,
} from "next/headers";

import {
  redirect,
} from "next/navigation";

import type { Database } from "@/supabase/types/database.types";

import {
  authService,
  deviceService,
  profileService,
} from "@/services";

type DeviceType =
  Database["public"]["Enums"]["device_type"];

const DEVICE_COOKIE_NAME =
  "dokter_ambis_device_identifier";

const VALID_DEVICE_TYPES:
  DeviceType[] = [
    "desktop",
    "laptop",
    "tablet",
    "mobile",
  ];

function getRoleDashboard(
  role: string,
): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";

    case "mentor":
      return "/dashboard/mentor";

    case "student":
      return "/dashboard/student";

    default:
      return "/login";
  }
}

function getFormString(
  formData: FormData,
  name: string,
): string {
  const value =
    formData.get(name);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseDeviceType(
  value: string,
): DeviceType {
  if (
    VALID_DEVICE_TYPES.includes(
      value as DeviceType,
    )
  ) {
    return value as DeviceType;
  }

  return "desktop";
}

function getIpAddress(
  forwardedFor: string | null,
  realIp: string | null,
): string | null {
  if (forwardedFor) {
    return (
      forwardedFor
        .split(",")[0]
        ?.trim() ?? null
    );
  }

  return realIp;
}

export async function loginAction(
  formData: FormData,
): Promise<void> {
  const email =
    getFormString(
      formData,
      "email",
    );

  const password =
    getFormString(
      formData,
      "password",
    );

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Email dan password wajib diisi.",
      )}`,
    );
  }

  const result =
    await authService.login(
      email,
      password,
    );

  if (result.error) {
    const isEmailNotConfirmed =
      result.error.message
        .toLowerCase()
        .includes("email not confirmed");

    redirect(
      `/login?error=${encodeURIComponent(
        isEmailNotConfirmed
          ? "Email belum dikonfirmasi. Silakan buka email Anda dan klik link konfirmasi terlebih dahulu."
          : "Email atau password tidak sesuai.",
      )}`,
    );
  }

  const profile =
    await profileService
      .getCurrentProfile();

  if (!profile) {
    await authService.logout();

    redirect(
      `/login?error=${encodeURIComponent(
        "Profil pengguna tidak ditemukan.",
      )}`,
    );
  }

  if (profile.status !== "active") {
    await authService.logout();

    redirect(
      `/login?error=${encodeURIComponent(
        "Akun Anda sedang tidak aktif.",
      )}`,
    );
  }

  if (profile.role === "student") {
    const cookieStore =
      await cookies();

    const requestHeaders =
      await headers();

    const savedDeviceIdentifier =
      cookieStore
        .get(
          DEVICE_COOKIE_NAME,
        )
        ?.value;

    const submittedDeviceIdentifier =
      getFormString(
        formData,
        "deviceIdentifier",
      );

    const deviceIdentifier =
      savedDeviceIdentifier ||
      submittedDeviceIdentifier;

    const deviceName =
      getFormString(
        formData,
        "deviceName",
      ) || "Perangkat peserta";

    const deviceType =
      parseDeviceType(
        getFormString(
          formData,
          "deviceType",
        ),
      );

    const userAgent =
      requestHeaders.get(
        "user-agent",
      );

    const ipAddress =
      getIpAddress(
        requestHeaders.get(
          "x-forwarded-for",
        ),
        requestHeaders.get(
          "x-real-ip",
        ),
      );

    try {
      await deviceService
        .registerOrRefreshStudentDevice({
          profileId:
            profile.id,
          deviceIdentifier,
          deviceName,
          deviceType,
          userAgent,
          ipAddress,
        });
    } catch (error) {
      await authService.logout();

      const message =
        error instanceof Error
          ? error.message
          : "Perangkat tidak dapat didaftarkan.";

      redirect(
        `/login?error=${encodeURIComponent(
          message,
        )}`,
      );
    }

    cookieStore.set(
      DEVICE_COOKIE_NAME,
      deviceIdentifier,
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge:
          60 * 60 * 24 * 365,
      },
    );
  }

  redirect(
    getRoleDashboard(
      profile.role,
    ),
  );
}

export async function logoutAction(): Promise<void> {
  await authService.logout();

  /*
   * Cookie Device ID sengaja tidak dihapus.
   * Logout tidak dianggap sebagai pergantian perangkat.
   */

  redirect("/login");
}