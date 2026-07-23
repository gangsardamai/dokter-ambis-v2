import { EmptyState } from "@/components/admin";

import OrganizationActionMenu from "./OrganizationActionMenu";
import OrganizationStatusBadge from "./OrganizationStatusBadge";

import type { Database } from "@/supabase/types/database.types";

type Organization =
  Database["public"]["Tables"]["organizations"]["Row"];

interface OrganizationTableProps {
  organizations: Organization[];
}

function UniversityIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 10 9-6 9 6" />
      <path d="M5 10v9" />
      <path d="M19 10v9" />
      <path d="M9 10v9" />
      <path d="M15 10v9" />
      <path d="M3 19h18" />
    </svg>
  );
}

export default function OrganizationTable({
  organizations,
}: OrganizationTableProps) {
  if (organizations.length === 0) {
    return (
      <EmptyState
        title="Belum ada Universitas"
        description="Silakan tambahkan universitas baru."
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {organizations.map((organization) => (
        <article
          key={organization.id}
          className="group min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 focus-within:ring-2 focus-within:ring-blue-200"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-white shadow-sm">
              <UniversityIcon />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                {organization.title}
              </h2>
              <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                {organization.short_name || "Tanpa singkatan"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-2xl bg-slate-50/80 p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Slug
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                {organization.slug}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {organization.is_general ? (
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700">Umum</span>
                ) : null}
                <OrganizationStatusBadge status={organization.status} />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <OrganizationActionMenu
              organizationId={organization.id}
              status={organization.status}
              isGeneral={organization.is_general}
            />
          </div>
        </article>
      ))}
    </div>
  );
}
