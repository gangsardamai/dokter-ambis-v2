import { redirect } from "next/navigation";

import {
  PageTitle,
} from "@/components/admin";

import ProgramForm
from "@/components/admin/program/ProgramForm";

import {
  createProgramAction,
} from "../actions";

import {
  mapProgramForm,
} from "@/lib/forms/program";

export default function CreateProgramPage() {

  async function createAction(
    formData: FormData
  ) {

    "use server";

    const result =
      await createProgramAction(
        mapProgramForm(formData)
      );

    if (!result.success) {

      throw new Error(
        result.message
      );

    }

    redirect(
      "/dashboard/admin/program"
    );

  }

  return (

    <main className="max-w-3xl mx-auto p-8">

      <PageTitle
        title="Tambah Program"
        description="Buat program baru."
      />

      <ProgramForm
        submitLabel="Simpan Program"
        action={createAction}
      />

    </main>

  );

}