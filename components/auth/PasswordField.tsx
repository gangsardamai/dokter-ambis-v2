"use client";

import { useState } from "react";

interface PasswordFieldProps {
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}

export default function PasswordField({
  label,
  value,
  required = false,
  placeholder,
  onChange,
}: PasswordFieldProps) {

  const [showPassword, setShowPassword] =
    useState(false);

  return (

    <div className="space-y-2">

      <label className="block text-sm font-medium">

        {label}

      </label>

      <div className="relative">

        <input
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-14 focus:border-blue-500 focus:outline-none"
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              (prev) => !prev
            )
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >

          {showPassword
            ? "Sembunyikan"
            : "Lihat"}

        </button>

      </div>

    </div>

  );

}