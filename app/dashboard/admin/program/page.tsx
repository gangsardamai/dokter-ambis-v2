import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";

import ProgramTable from "@/components/admin/program/ProgramTable";

import { programService } from "@/services";

import { deleteProgramAction } from "./actions";

export default async function ProgramPage() {
  const programs = await programService.getPrograms();

  async function handleDelete(
    id: string,
  ) {
    "use server";

    await deleteProgramAction(
      id,
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Program"
        description="Kelola daftar program."
        actions={(
          <PrimaryButton
            href="/dashboard/admin/program/create"
            className="w-full sm:w-auto"
          >
            Tambah Program
          </PrimaryButton>
        )}
      />

      <ProgramTable
        programs={programs}
        onDelete={handleDelete}
      />
    </main>
  );
}
