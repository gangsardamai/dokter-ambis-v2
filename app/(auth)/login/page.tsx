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
    registered?: string | string[];
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
    getParamValue(
      params.error,
    );

  const showConfirmationNotice =
    getParamValue(
      params.registered,
    ) === "check-email";

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
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="M5 7h14v10H5V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m6 8 6 4 6-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div>
                <p className="font-bold">
                  Pendaftaran berhasil — periksa email Anda
                </p>
                <p className="mt-1 leading-6 text-blue-800">
                  Kami telah mengirim link konfirmasi. Buka kotak masuk atau folder spam, klik link tersebut, lalu kembali ke halaman ini untuk masuk.
                </p>
              </div>
            </div>
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