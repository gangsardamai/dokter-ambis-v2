import { redirect } from "next/navigation";

import { PageTitle } from "@/components/admin";
import ProgramForm from "@/components/admin/program/ProgramForm";
import { createProgramAction } from "../actions";
import { mapProgramForm } from "@/lib/forms/program";
import { organizationService } from "@/services";

export default async function CreateProgramPage() {
  const organizations = await organizationService.getOrganizations();

  async function createAction(formData: FormData) {
    "use server";
    const result = await createProgramAction(mapProgramForm(formData));
    if (!result.success) throw new Error(result.message);
    redirect("/dashboard/admin/program");
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <PageTitle title="Tambah Program" description="Buat program baru." />
      <ProgramForm
        submitLabel="Simpan Program"
        action={createAction}
        organizationOptions={organizations.map((item) => ({ label: item.is_general ? `${item.title} (Umum)` : item.title, value: item.id }))}
      />
    </main>
  );
}
