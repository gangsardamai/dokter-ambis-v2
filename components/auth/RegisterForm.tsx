"use client";

import { useState } from "react";

import {
  AuthCard,
  AuthSubmitButton,
  PasswordField,
} from "@/components/auth";

export interface RegisterFormData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
}

interface RegisterFormProps {
  onSubmit: (
    data: RegisterFormData
  ) => Promise<{
    success: boolean;
    message: string;
  }>;
}

export default function RegisterForm({
  onSubmit,
}: RegisterFormProps) {

  const [fullName, setFullName] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    agreeTerms,
    setAgreeTerms,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {

    e.preventDefault();

    setError("");

    if (password !== confirmPassword) {

      setError(
        "Konfirmasi password tidak sama."
      );

      return;

    }

    if (password.length < 6) {

      setError(
        "Password minimal terdiri dari 6 karakter."
      );

      return;

    }

    if (!agreeTerms) {

      setError(
        "Anda harus menyetujui Syarat & Ketentuan."
      );

      return;

    }

    setLoading(true);

    try {

      const result =
        await onSubmit({

          fullName,

          phone,

          email,

          password,

        });

      if (!result.success) {

        setError(result.message);

      }

    } finally {

      setLoading(false);

    }

  }

  return (

    <AuthCard
      title="Daftar"
      description="Buat akun Dokter Ambis"
    >

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        <div>

          <label className="mb-2 block text-sm font-medium">

            Nama Lengkap

          </label>

          <input
            value={fullName}
            required
            onChange={(e) =>
              setFullName(
                e.target.value
              )
            }
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
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
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
            onChange={(e) =>
              setPhone(
                e.target.value
              )
            }
            placeholder="Contoh: 081234567890"
            className="w-full rounded-lg border border-gray-300 px-4 py-3"
          />

          <p className="mt-2 text-xs text-gray-500">

            Nomor WhatsApp digunakan untuk
            informasi kelas, konfirmasi
            pembayaran, dan komunikasi
            dengan tim Dokter Ambis.

          </p>

        </div>

        <PasswordField
          label="Password"
          value={password}
          required
          onChange={setPassword}
        />

        <PasswordField
          label="Konfirmasi Password"
          value={confirmPassword}
          required
          onChange={
            setConfirmPassword
          }
        />

        <label className="flex items-start gap-3">

          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) =>
              setAgreeTerms(
                e.target.checked
              )
            }
          />

          <span className="text-sm text-gray-700">

            Saya menyetujui
            Syarat & Ketentuan
            serta Kebijakan Privasi
            Dokter Ambis.

          </span>

        </label>

        {error && (

          <div className="rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        )}

        <AuthSubmitButton
          loading={loading}
        >

          Daftar

        </AuthSubmitButton>

      </form>

    </AuthCard>

  );

}