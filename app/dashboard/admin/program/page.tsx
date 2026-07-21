import Link from "next/link";

import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";

import ProgramTable
from "@/components/admin/program/ProgramTable";

import {
  programService,
} from "@/services";

import {
  deleteProgramAction,
} from "./actions";

export default async function ProgramPage() {

  const programs =
    await programService.getPrograms();

  async function handleDelete(
    id: string
  ) {

    "use server";

    await deleteProgramAction(
      id
    );

  }

  return (

    <main className="max-w-7xl mx-auto p-8 space-y-8">

      <PageHeader

        title="Program"

        description="Kelola daftar program."

        actions={

          <Link
            href="/dashboard/admin/program/create"
          >

            <PrimaryButton>

              Tambah Program

            </PrimaryButton>

          </Link>

        }

      />

      <ProgramTable

        programs={programs}

        onDelete={handleDelete}

      />

    </main>

  );

}