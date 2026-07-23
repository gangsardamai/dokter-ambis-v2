import Link from "next/link";

import {
  DeleteProgramButton,
  EmptyState,
} from "@/components/admin";

import ProgramStatusBadge from "./ProgramStatusBadge";

import type { ProgramWithOrganization } from "@/repositories/program.repository";

interface ProgramTableProps {
  programs: ProgramWithOrganization[];
  onDelete?: (id: string) => Promise<void>;
}

function ProgramIcon() {
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
      <path d="M4 19.5V6a2 2 0 0 1 2-2h12v16H6a2 2 0 0 1-2-2.5Z" />
      <path d="M8 8h6" />
      <path d="M8 12h7" />
    </svg>
  );
}

export default function ProgramTable({
  programs,
  onDelete,
}: ProgramTableProps) {
  if (programs.length === 0) {
    return (
      <EmptyState
        title="Belum ada Program"
        description="Silakan tambahkan program baru."
      />
    );
  }

  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {programs.map((program) => (
        <article
          key={program.id}
          className="group min-w-0 rounded-3xl border border-blue-100/80 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/10 focus-within:ring-2 focus-within:ring-blue-200"
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#1769cf] to-[#033b63] text-white shadow-sm">
              <ProgramIcon />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-extrabold tracking-[-0.03em] text-[#061827]">
                {program.title}
              </h2>
              <p className="mt-2 break-all rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1769cf]">
                {program.slug}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-blue-100/70 bg-blue-50/50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Organization
            </p>

            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 break-words text-sm font-extrabold text-[#061827]">
                {program.organization.title}
              </p>

              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#1769cf] ring-1 ring-blue-100">
                {program.organization.short_name}
              </span>

              {program.organization.is_general && (
                <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-700 ring-1 ring-cyan-100">
                  Umum
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50/80 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Status
            </p>
            <ProgramStatusBadge status={program.status} />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/admin/program/${program.id}/edit`}
              className="inline-flex min-h-10 items-center rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-[#1769cf] transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Edit
            </Link>

            {onDelete && (
              <DeleteProgramButton
                id={program.id}
                onDelete={onDelete}
              />
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
