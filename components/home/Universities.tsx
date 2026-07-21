import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

interface UniversitiesProps {
  organizations: Organization[];
}

export default function Universities({
  organizations,
}: UniversitiesProps) {
  return (
    <section
      id="universitas"
      className="bg-[#f6f9fe] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Judul section */}
        <div className="mx-auto max-w-3xl text-center">
         
          <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-[#061827] sm:text-4xl">
  Universitas Tersedia
</h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Pilih universitas untuk menemukan blok
            dan materi yang disusun sesuai sistem
            pembelajaran di kampusmu.
          </p>
        </div>

        {/* Daftar universitas */}
        {organizations.length > 0 ? (
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {organizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/universitas/${organization.slug}/blok`}
                className="group flex min-h-32 items-center gap-4 rounded-2xl border border-blue-100 bg-white p-5 shadow-[0_6px_22px_rgba(3,59,99,0.06)] transition duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_15px_32px_rgba(3,59,99,0.12)]"
              >
                {/* Singkatan universitas */}
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-xs font-extrabold text-[#1769cf] ring-1 ring-blue-100">
                  {organization.short_name}
                </span>

                {/* Informasi universitas */}
                <span className="min-w-0 flex-1">
                  <strong className="block text-base font-bold leading-6 text-[#061827]">
                    {organization.title}
                  </strong>

                  <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#1769cf]">
                    Lihat program

                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-11 max-w-xl rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-[#061827]">
              Universitas belum tersedia
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Daftar universitas aktif akan
              ditampilkan di sini.
            </p>
          </div>
        )}

        {/* Tombol semua universitas */}
        {organizations.length > 0 && (
          <div className="mt-9 text-center">
            <Link
              href="/universitas"
              className="inline-flex rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-bold text-[#1769cf] transition hover:border-blue-400 hover:bg-blue-50"
            >
              Lihat Semua Universitas
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}