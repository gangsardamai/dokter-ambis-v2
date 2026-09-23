import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";

import ProgramTable from "@/components/admin/program/ProgramTable";

import { leaderAccessService, profileService, programService } from "@/services";

import { deleteProgramAction } from "./actions";

export default async function ProgramPage() {
  const [programs, profile] = await Promise.all([
    programService.getPrograms(),
    profileService.getCurrentProfile(),
  ]);

  async function handleDelete(
    id: string,
  ) {
    "use server";

    await deleteProgramAction(
      id,
    );
  }

  const manageable = await leaderAccessService.getAssignablePrograms(programs);

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
        programs={manageable}
        onDelete={profile?.role === "admin" ? handleDelete : undefined}
      />
    </main>
  );
}
