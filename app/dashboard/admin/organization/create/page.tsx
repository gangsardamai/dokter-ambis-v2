import { redirect } from "next/navigation";

import {
  PageTitle,
 } from "@/components/admin";

import OrganizationForm
from "@/components/admin/organization/OrganizationForm";

import {
  createOrganizationAction,
} from "../actions";

import {
  mapOrganizationForm,
} from "@/lib/forms/organization";

export default function CreateOrganizationPage() {

  async function createAction(
    formData: FormData
  ) {

    "use server";

    const result =
      await createOrganizationAction(
        mapOrganizationForm(formData)
      );

    if (!result.success) {

      throw new Error(result.message);

    }

    redirect(
      "/dashboard/admin/organization"
    );

  }

  return (

    <main className="max-w-3xl mx-auto p-8">

      <PageTitle
        title="Tambah Universitas"
        description="Buat universitas baru."
      />

      <OrganizationForm
        submitLabel="Simpan Universitas"
        action={createAction}
      />

    </main>

  );

}