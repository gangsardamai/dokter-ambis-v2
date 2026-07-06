"use client";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({
  error,
  reset,
}: ErrorProps) {

  console.error(error);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">

      <div className="max-w-lg text-center">

        <h1 className="text-4xl font-bold text-red-600">
          Terjadi Kesalahan
        </h1>

        <p className="mt-4 text-gray-600">
          Maaf, terjadi kesalahan saat memuat halaman.
        </p>

        <button
          onClick={reset}
          className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Coba Lagi
        </button>

      </div>

    </main>
  );
}