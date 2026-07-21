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

export default function OrganizationActionMenu({
  organizationId,
  status,
}: OrganizationActionMenuProps) {
  const [isPending, startTransition] = useTransition();

  const isActive = status === "active";

  function handleActivate() {
    startTransition(async () => {
      const result = await activateOrganizationAction(
        organizationId
      );

      if (!result.success) {
        alert(result.message);
      }
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      const result = await deactivateOrganizationAction(
        organizationId
      );

      if (!result.success) {
        alert(result.message);
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus universitas ini?"
    );

    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteOrganizationAction(
        organizationId
      );

      if (!result.success) {
        alert(result.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">

      <Link
        href={`/dashboard/admin/organization/${organizationId}`}
        className="
          rounded
          border
          px-3
          py-1
          text-sm
          hover:bg-gray-100
        "
      >
        Detail
      </Link>

      <Link
        href={`/dashboard/admin/organization/${organizationId}/edit`}
        className="
          rounded
          bg-blue-600
          px-3
          py-1
          text-sm
          text-white
          hover:bg-blue-700
        "
      >
        Edit
      </Link>

      {isActive ? (
        <button
          type="button"
          disabled={isPending}
          onClick={handleDeactivate}
          className="
            rounded
            bg-yellow-500
            px-3
            py-1
            text-sm
            text-white
            hover:bg-yellow-600
            disabled:opacity-50
          "
        >
          Nonaktifkan
        </button>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={handleActivate}
          className="
            rounded
            bg-green-600
            px-3
            py-1
            text-sm
            text-white
            hover:bg-green-700
            disabled:opacity-50
          "
        >
          Aktifkan
        </button>
      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="
          rounded
          bg-red-600
          px-3
          py-1
          text-sm
          text-white
          hover:bg-red-700
          disabled:opacity-50
        "
      >
        {isPending ? "Memproses..." : "Hapus"}
      </button>

    </div>
  );
}