"use client";

import type { Profile } from "@/types";
import { logoutAction } from "@/app/actions/auth.actions";
import { useDashboardSidebar } from "./DashboardLayout";

interface DashboardHeaderProps {
  profile: Profile;
  onMenuClick?: () => void;
}

const titleByRole = {
  admin: "Admin DokterAmbis",
  mentor: "Mentor DokterAmbis",
  student: "Student DokterAmbis",
} as const;

const roleLabel = {
  admin: "Admin",
  mentor: "Mentor",
  student: "Mahasiswa",
} as const;

export default function DashboardHeader({
  profile,
  onMenuClick,
}: DashboardHeaderProps) {
  const sidebar = useDashboardSidebar();
  const initials = profile.full_name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-lg">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick ?? sidebar?.openSidebar}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-[#061827] transition hover:border-blue-200 hover:bg-blue-50 lg:hidden"
            aria-label="Buka menu dashboard"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#1769cf]">
              Dashboard
            </p>
            <h1 className="truncate text-lg font-extrabold tracking-[-0.03em] text-[#061827] sm:text-xl">
              {titleByRole[profile.role]}
            </h1>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-sm font-bold text-[#061827]">
              {profile.full_name}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {roleLabel[profile.role]}
            </p>
          </div>

          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#1769cf] to-[#033b63] text-sm font-extrabold text-white shadow-sm">
            {initials}
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-[#033b63] transition hover:border-blue-200 hover:bg-blue-50 sm:px-4"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
