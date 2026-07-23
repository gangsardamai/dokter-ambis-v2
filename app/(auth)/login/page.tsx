import Link from "next/link";
import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import {
  authService,
  profileService,
} from "@/services";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string | string[];
    registered?: string | string[];
    confirmed?: string | string[];
    next?: string | string[];
  }>;
}

function getParamValue(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getSafeStudentNextPath(value: string): string {
  if (
    value.startsWith("/dashboard/student/") &&
    !value.startsWith("//")
  ) {
    return value;
  }

  return "";
}

function getDashboardPath(role: string): string {
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

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const nextPath = getSafeStudentNextPath(
    getParamValue(params.next),
  );
  const authenticated = await authService.isAuthenticated();

  if (authenticated) {
    const profile = await profileService.getCurrentProfile();

    if (profile && profile.status === "active") {
      redirect(
        profile.role === "student" && nextPath
          ? nextPath
          : getDashboardPath(profile.role),
      );
    }
  }

  const errorMessage = getParamValue(params.error);
  const showConfirmationNotice =
    getParamValue(params.registered) === "check-email";
  const showConfirmedNotice =
    getParamValue(params.confirmed) === "true";
  const registerHref = nextPath
    ? `/register?next=${encodeURIComponent(nextPath)}`
    : "/register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Dokter Ambis
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Masuk
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Masuk menggunakan akun yang telah terdaftar.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {showConfirmationNotice && (
          <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-900">
            <p className="font-bold">
              Pendaftaran berhasil — periksa email Anda
            </p>
            <p className="mt-1 leading-6 text-blue-800">
              Klik link konfirmasi pada kotak masuk atau folder spam,
              lalu kembali ke halaman ini untuk masuk.
            </p>
          </div>
        )}

        {showConfirmedNotice && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
            <p className="font-bold">Email berhasil dikonfirmasi</p>
            <p className="mt-1 leading-6 text-emerald-800">
              Akun Anda sudah aktif. Silakan masuk menggunakan email
              dan password yang telah didaftarkan.
            </p>
          </div>
        )}

        <LoginForm nextPath={nextPath} />

        <p className="mt-5 text-center text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link
            href={registerHref}
            className="font-black text-blue-600 hover:text-blue-700 hover:underline"
          >
            Klik Daftar
          </Link>
        </p>

        <p className="mt-5 text-center text-xs text-gray-500">
          Akun peserta dapat digunakan pada maksimal dua perangkat aktif.
        </p>
      </div>
    </main>
  );
}
