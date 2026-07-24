import Link from "next/link";

import type { Database } from "@/supabase/types/database.types";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

interface UniversitiesProps {
  organizations: Organization[];
}

function getOrganizationDescription(
  organization: Organization,
): string {
  if (organization.is_general) {
    return "UKNPDPD • Kepenulisan • Kelas Umum";
  }

  return "Kelas sesuai sistem pembelajaran kampus";
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
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
            Katalog Kelas DokterAmbis
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] text-[#061827] sm:text-4xl">
            Yuk Cari Kelas Menarik !!!
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Temukan kelas sesuai universitasmu atau ikuti program umum
            seperti UKNPDPD, kepenulisan ilmiah, dan kelas lintas
            universitas.
          </p>
        </div>

        {organizations.length > 0 ? (
          <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {organizations.map((organization) => (
              <Link
                key={organization.id}
                href={`/kelas?organization=${encodeURIComponent(
                  organization.slug,
                )}`}
                className="group relative min-h-52 overflow-hidden rounded-3xl border border-blue-100 bg-white p-5 shadow-[0_8px_28px_rgba(3,59,99,0.07)] transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_18px_40px_rgba(3,59,99,0.13)]"
              >
                <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-blue-100/80 blur-2xl transition group-hover:bg-cyan-100" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 text-xs font-extrabold text-[#1769cf] ring-1 ring-blue-100">
                      {organization.short_name}
                    </span>

                    {organization.is_general && (
                      <span className="rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-700">
                        Program Nasional
                      </span>
                    )}
                  </div>

                  <strong className="mt-5 block text-lg font-black leading-6 tracking-[-0.02em] text-[#061827]">
                    {organization.title}
                  </strong>

                  <span className="mt-2 block text-sm leading-6 text-slate-500">
                    {getOrganizationDescription(organization)}
                  </span>

                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-black text-[#1769cf]">
                    Lihat kelas
                    <span className="transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-11 max-w-xl rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-[#061827]">
              Kelas belum tersedia
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Organization aktif akan ditampilkan di sini.
            </p>
          </div>
        )}

        {organizations.length > 0 && (
          <div className="mt-9 text-center">
            <Link
              href="/kelas"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 py-3 text-sm font-black text-[#1769cf] transition hover:border-blue-400 hover:bg-blue-50"
            >
              Lihat Semua Kelas
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
