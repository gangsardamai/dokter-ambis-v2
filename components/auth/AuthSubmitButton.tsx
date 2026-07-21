"use client";

interface AuthSubmitButtonProps {
  loading?: boolean;
  children: string;
}

export default function AuthSubmitButton({
  loading = false,
  children,
}: AuthSubmitButtonProps) {

  return (

    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >

      {loading
        ? "Memproses..."
        : children}

    </button>

  );

}