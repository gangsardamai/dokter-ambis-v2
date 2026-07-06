import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">

      <div className="text-center">

        <h1 className="text-7xl font-bold text-blue-600">
          404
        </h1>

        <h2 className="mt-6 text-3xl font-bold">
          Halaman Tidak Ditemukan
        </h2>

        <p className="mt-4 text-gray-600">
          Halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
        >
          Kembali ke Beranda
        </Link>

      </div>

    </main>
  );
}