"use client";

import Link from "next/link";
import { useTransition } from "react";

import {
  activateOrganizationAction,
  deactivateOrganizationAction,
  deleteOrganizationAction,
} from "@/app/dashboard/admin/organization/actions";

import type { Database } from "@/supabase/types/database.types";

type OrganizationStatus =
  Database["public"]["Enums"]["organization_status"];

interface OrganizationActionMenuProps {
  organizationId: string;
  status: OrganizationStatus;
}

const actionBase =
  "inline-flex min-h-10 items-center rounded-xl px-4 py-2 text-sm font-bold transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60";

export default function OrganizationActionMenu({
  organizationId,
  status,
}: OrganizationActionMenuProps) {
  const [isPending, startTransition] = useTransition();
  const isActive = status === "active";

  function handleActivate() {
    startTransition(async () => {
      const result = await activateOrganizationAction(
        organizationId,
      );

      if (!result.success) {
        alert(result.message);
      }
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateOrganizationAction(
        organizationId,
      );

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
      const result = await deleteOrganizationAction(
        organizationId,
      );

      if (!result.success) {
        alert(result.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/dashboard/admin/organization/${organizationId}`}
        className={`${actionBase} bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-200`}
      >
        Detail
      </Link>

      <Link
        href={`/dashboard/admin/organization/${organizationId}/edit`}
        className={`${actionBase} bg-blue-50 text-[#1769cf] hover:bg-blue-100 focus:ring-blue-200`}
      >
        Edit
      </Link>

      {isActive ? (
        <button
          type="button"
          disabled={isPending}
          onClick={handleDeactivate}
          className={`${actionBase} bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-200`}
        >
          Nonaktifkan
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={handleActivate}
          className={`${actionBase} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-200`}
        >
          Aktifkan
        </button>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className={`${actionBase} bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-200`}
      >
        {isPending ? "Memproses..." : "Hapus"}
      </button>
    </div>
  );
}
