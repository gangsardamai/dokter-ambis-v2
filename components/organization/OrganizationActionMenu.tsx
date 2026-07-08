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

interface Props {
  organizationId: string;
  status: OrganizationStatus;
}

export default function OrganizationActionMenu({
  organizationId,
  status,
}: Props) {

  const [isPending, startTransition] =
    useTransition();

  const isActive =
    status === "active";

  function handleActivate() {
    startTransition(async () => {
      await activateOrganizationAction(
        organizationId
      );
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      await deactivateOrganizationAction(
        organizationId
      );
    });
  }

  function handleDelete() {

    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menghapus universitas ini?"
      );

    if (!confirmed) return;

    startTransition(async () => {
      await deleteOrganizationAction(
        organizationId
      );
    });

  }

  return (
    <div className="flex justify-end gap-2">

      <Link
        href={`/dashboard/admin/organization/${organizationId}`}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        Detail
      </Link>

      <Link
        href={`/dashboard/admin/organization/${organizationId}/edit`}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        Edit
      </Link>

      {isActive ? (

        <button
          type="button"
          disabled={isPending}
          onClick={handleDeactivate}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Nonaktifkan
        </button>

      ) : (

        <button
          type="button"
          disabled={isPending}
          onClick={handleActivate}
          className="rounded border px-3 py-1 text-sm hover:bg-green-50 disabled:opacity-50"
        >
          Aktifkan
        </button>

      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        Hapus
      </button>

    </div>
  );
}