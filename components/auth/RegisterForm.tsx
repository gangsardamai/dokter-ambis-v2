"use client";

import Link from "next/link";
import { useState } from "react";

import { registerAction } from "@/app/(auth)/register/actions";
import {
  AuthCard,
  AuthSubmitButton,
  PasswordField,
} from "@/components/auth";
import {
  OTHER_UNIVERSITY_VALUE,
  UNIVERSITY_OPTIONS,
} from "@/lib/university-options";

interface RegisterFormProps {
  nextPath?: string;
}

export default function RegisterForm({
  nextPath = "",
}: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [universityOrigin, setUniversityOrigin] = useState("");
  const [universityOriginOther, setUniversityOriginOther] =
    useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");

    if (!universityOrigin) {
      setError("Silakan pilih universitas asal Anda.");
      return;
    }

    if (
      universityOrigin === OTHER_UNIVERSITY_VALUE &&
      universityOriginOther.trim().length < 2
    ) {
      setError("Silakan tuliskan nama universitas asal Anda.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    if (password.length < 6) {
      setError("Password minimal terdiri dari 6 karakter.");
      return;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerAction({
        fullName,
        email,
        phone,
        universityOrigin,
        universityOriginOther,
        password,
        nextPath,
      });

      if (result.success) {
        window.location.replace(
          result.redirectTo ?? "/login?registered=check-email",
        );
        return;
      }

      setError(result.message);
    } catch {
      setError(
        "Terjadi gangguan saat melakukan pendaftaran. Silakan coba kembali.",
      );
    } finally {
      setLoading(false);
    }
  }

  const loginHref = nextPath
    ? `/login?next=${encodeURIComponent(nextPath)}`
    : "/login";

  return (
    <AuthCard
      title="Daftar"
      description="Buat akun Dokter Ambis"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Nama Lengkap
          </label>
          <input
            value={fullName}
            required
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Nomor WhatsApp
          </label>
          <input
            value={phone}
            required
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />
          <p className="mt-2 text-xs text-gray-500">
            Nomor WhatsApp digunakan untuk informasi kelas,
            konfirmasi pembayaran, dan komunikasi dengan tim Dokter
            Ambis.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Universitas Asal
          </label>
          <select
            value={universityOrigin}
            required
            onChange={(event) => {
              setUniversityOrigin(event.target.value);

              if (event.target.value !== OTHER_UNIVERSITY_VALUE) {
                setUniversityOriginOther("");
              }
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3"
          >
            <option value="" disabled>
              Pilih universitas asal
            </option>
            {UNIVERSITY_OPTIONS.map((university) => (
              <option key={university} value={university}>
                {university}
              </option>
            ))}
            <option value={OTHER_UNIVERSITY_VALUE}>
              Universitas lainnya
            </option>
          </select>
          <p className="mt-2 text-xs text-gray-500">
            Data ini hanya digunakan untuk pendataan peserta dan tidak
            membatasi program yang dapat dibeli.
          </p>
        </div>

        {universityOrigin === OTHER_UNIVERSITY_VALUE && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nama Universitas
            </label>
            <input
              value={universityOriginOther}
              required
              maxLength={150}
              onChange={(event) =>
                setUniversityOriginOther(event.target.value)
              }
              placeholder="Tuliskan nama universitas asal"
              className="w-full rounded-lg border border-gray-300 px-4 py-3"
            />
          </div>
        )}

        <div>
          <PasswordField
            label="Password"
            value={password}
            required
            onChange={setPassword}
          />
          <p className="mt-2 text-xs text-gray-500">
            Password minimal 6 karakter.
          </p>
        </div>

        <PasswordField
          label="Konfirmasi Password"
          value={confirmPassword}
          required
          onChange={setConfirmPassword}
        />

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(event) => setAgreeTerms(event.target.checked)}
          />
          <span className="text-sm text-gray-700">
            Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi
            Dokter Ambis.
          </span>
        </label>

        {error && (
          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <AuthSubmitButton loading={loading}>
          Daftar
        </AuthSubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Sudah punya akun?{" "}
        <Link
          href={loginHref}
          className="font-black text-blue-600 hover:text-blue-700 hover:underline"
        >
          Masuk
        </Link>
      </p>
    </AuthCard>
  );
}
