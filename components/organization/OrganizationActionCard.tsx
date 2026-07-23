"use client";

import Link from "next/link";
import { useTransition } from "react";

import { Card } from "@/components/ui";

import {
  activateOrganizationAction,
  deactivateOrganizationAction,
  deleteOrganizationAction,
} from "@/app/dashboard/admin/organization/actions";

import type { Database } from "@/supabase/types/database.types";

type OrganizationStatus =
  Database["public"]["Enums"]["organization_status"];

interface OrganizationActionCardProps {
  organizationId: string;
  status: OrganizationStatus;
  isGeneral: boolean;
}

const buttonBase =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export default function OrganizationActionCard({
  organizationId,
  status,
  isGeneral,
}: OrganizationActionCardProps) {
  const [isPending, startTransition] = useTransition();
  const isActive = status === "active";

  function handleStatusChange() {
    startTransition(async () => {
      const result = isActive
        ? await deactivateOrganizationAction(organizationId)
        : await activateOrganizationAction(organizationId);

      if (!result.success) {
        alert(result.message);
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus universitas ini?",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteOrganizationAction(organizationId);

      if (!result.success) {
        alert(result.message);
      }
    });
  }

  return (
    <Card>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-[#053b67] text-white shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                d="M12 3 4 7v10l8 4 8-4V7l-8-4Z"
                strokeLinejoin="round"
              />
              <path d="M9 12h6M12 9v6" strokeLinecap="round" />
            </svg>
          </span>

          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-950">
              Manajemen Universitas
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Edit informasi dan atur status universitas.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href={`/dashboard/admin/organization/${organizationId}/edit`}
            className={`${buttonBase} bg-gradient-to-r from-blue-600 to-[#064a78] text-white shadow-sm hover:from-blue-700 hover:to-[#053b67] focus:ring-blue-300`}
          >
            Edit Universitas
          </Link>

          <button
            type="button"
            disabled={isPending}
            onClick={handleStatusChange}
            className={`${buttonBase} ${
              isActive
                ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-200"
                : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-200"
            }`}
          >
            {isPending
              ? "Memproses..."
              : isActive
                ? "Nonaktifkan Universitas"
                : "Aktifkan Universitas"}
          </button>
        </div>

        {isGeneral ? (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
            <p className="text-sm font-semibold leading-5 text-blue-800">
              Organization umum dilindungi dan tidak dapat dihapus.
            </p>
          </div>
        ) : (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className={`${buttonBase} border border-red-200 bg-white text-red-600 hover:bg-red-50 focus:ring-red-200`}
            >
              {isPending ? "Memproses..." : "Hapus Universitas"}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
