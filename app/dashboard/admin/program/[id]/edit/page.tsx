import { notFound } from "next/navigation";

import {
  PageTitle,
} from "@/components/admin";

import ProgramForm
from "@/components/admin/program/ProgramForm";

import {
  programService,
} from "@/services";

import {
  updateProgramAction,
} from "../../actions";

import {
  mapProgramForm,
} from "@/lib/forms/program";

interface EditProgramPageProps {

  params: Promise<{
    id: string;
  }>;

}

export default async function EditProgramPage({

  params,

}: EditProgramPageProps) {

  const { id } = await params;

  const program =
    await programService.getProgramById(
      id
    );

  if (!program) {

    notFound();

  }

  async function updateAction(
    formData: FormData
  ) {

    "use server";

    const result =
      await updateProgramAction(

        id,

        mapProgramForm(
          formData
        )

      );

    if (!result.success) {

      throw new Error(
        result.message
      );

    }

  }

  return (

    <main className="max-w-3xl mx-auto p-8">

      <PageTitle
        title="Edit Program"
        description="Ubah data program."
      />

      <ProgramForm
        defaultValues={program}
        submitLabel="Update Program"
        action={updateAction}
      />

    </main>

  );

}