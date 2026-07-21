import {
  redirect,
} from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";

import {
  authService,
  profileService,
} from "@/services";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string | string[];
  }>;
}

function getErrorMessage(
  value: string | string[] | undefined,
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getDashboardPath(
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

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const authenticated =
    await authService.isAuthenticated();

  if (authenticated) {
    const profile =
      await profileService
        .getCurrentProfile();

    if (
      profile &&
      profile.status === "active"
    ) {
      redirect(
        getDashboardPath(
          profile.role,
        ),
      );
    }
  }

  const params =
    await searchParams;

  const errorMessage =
    getErrorMessage(
      params.error,
    );

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

        <LoginForm />

        <p className="mt-6 text-center text-xs text-gray-500">
          Akun peserta dapat digunakan pada maksimal dua perangkat aktif.
        </p>
      </div>
    </main>
  );
}