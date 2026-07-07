"use client";

import { useTransition } from "react";

import {
  activateProgramAction,
  deactivateProgramAction,
  deleteProgramAction,
} from "@/app/dashboard/admin/program/actions";

import type { ProgramStatus } from "./ProgramForm";

interface ProgramActionButtonsProps {
  programId: string;
  status: ProgramStatus;
}

export default function ProgramActionButtons({
  programId,
  status,
}: ProgramActionButtonsProps) {
  const [isPending, startTransition] =
    useTransition();

  const isActive =
    status === "active";

  function handleActivate() {
    startTransition(async () => {
      await activateProgramAction(
        programId
      );
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      await deactivateProgramAction(
        programId
      );
    });
  }

  function handleDelete() {

    const confirmed =
      window.confirm(
        "Apakah Anda yakin ingin menghapus program ini?"
      );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      await deleteProgramAction(
        programId
      );
    });

  }

  return (
    <div className="space-y-3">

      {isActive ? (

        <button
          type="button"
          disabled={isPending}
          onClick={handleDeactivate}
          className="w-full rounded-lg border px-4 py-2 transition hover:bg-gray-100 disabled:opacity-50"
        >
          {isPending
            ? "Memproses..."
            : "Nonaktifkan Program"}
        </button>

      ) : (

        <button
          type="button"
          disabled={isPending}
          onClick={handleActivate}
          className="w-full rounded-lg border border-green-300 px-4 py-2 text-green-700 transition hover:bg-green-50 disabled:opacity-50"
        >
          {isPending
            ? "Memproses..."
            : "Aktifkan Program"}
        </button>

      )}

      <button
        type="button"
        disabled={isPending}
        onClick={handleDelete}
        className="w-full rounded-lg border border-red-300 px-4 py-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {isPending
          ? "Memproses..."
          : "Hapus Program"}
      </button>

    </div>
  );
}