"use client";

interface ExplorerErrorProps {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}

export default function ExplorerError({
  error,
  reset,
}: ExplorerErrorProps) {
  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">

        <h1 className="mb-2 text-2xl font-bold text-red-700">
          Terjadi Kesalahan
        </h1>

        <p className="mb-4 text-gray-700">
          Explorer tidak dapat dimuat.
        </p>

        <p className="mb-6 rounded bg-white p-3 font-mono text-sm text-gray-600">
          {error.message}
        </p>

        <button
          type="button"
          onClick={() => reset()}
          className="
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-white
            hover:bg-blue-700
          "
        >
          Coba Lagi
        </button>

      </div>
    </main>
  );
}