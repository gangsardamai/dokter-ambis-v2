import Link from "next/link";

import { Container, PageHeader } from "@/components/layout";
import { Card } from "@/components/ui";

export default function AdminDashboardPage() {
  return (
    <Container>

      <PageHeader
        title="Dashboard Admin"
        description="Kelola seluruh data dan aktivitas Dokter Ambis."
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        <Card>

          <h2 className="text-xl font-semibold">
            Program
          </h2>

          <p className="mt-2 text-gray-600">
            Kelola seluruh program pembelajaran.
          </p>

          <Link
            href="/dashboard/admin/program"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buka
          </Link>

        </Card>

        <Card>

          <h2 className="text-xl font-semibold">
            Universitas
          </h2>

          <p className="mt-2 text-gray-600">
            Kelola universitas yang tersedia.
          </p>

          <Link
            href="/dashboard/admin/universitas"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buka
          </Link>

        </Card>

        <Card>

          <h2 className="text-xl font-semibold">
            Mentor
          </h2>

          <p className="mt-2 text-gray-600">
            Kelola mentor pengajar.
          </p>

          <Link
            href="/dashboard/admin/mentor"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buka
          </Link>

        </Card>

        <Card>

          <h2 className="text-xl font-semibold">
            Mahasiswa
          </h2>

          <p className="mt-2 text-gray-600">
            Kelola data mahasiswa.
          </p>

          <Link
            href="/dashboard/admin/student"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buka
          </Link>

        </Card>

        <Card>

          <h2 className="text-xl font-semibold">
            Enrollment
          </h2>

          <p className="mt-2 text-gray-600">
            Kelola pendaftaran mahasiswa.
          </p>

          <Link
            href="/dashboard/admin/enrollment"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buka
          </Link>

        </Card>

        <Card>

          <h2 className="text-xl font-semibold">
            Pembayaran
          </h2>

          <p className="mt-2 text-gray-600">
            Kelola pembayaran peserta.
          </p>

          <Link
            href="/dashboard/admin/payment"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Buka
          </Link>

        </Card>

      </div>

    </Container>
  );
}