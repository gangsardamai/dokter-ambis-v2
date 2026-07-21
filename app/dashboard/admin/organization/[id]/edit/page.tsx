import {
  notFound,
  redirect,
} from "next/navigation";

import {
  PageTitle,
} from "@/components/admin";

import OrganizationForm
from "@/components/admin/organization/OrganizationForm";

import {
  organizationService,
} from "@/services";

import {
  updateOrganizationAction,
} from "../../actions";

import {
  mapOrganizationForm,
} from "@/lib/forms/organization";

interface EditOrganizationPageProps {

  params: Promise<{
    id: string;
  }>;

}

export default async function EditOrganizationPage({

  params,

}: EditOrganizationPageProps) {

  const { id } =
    await params;

  const organization =
    await organizationService.getOrganizationById(
      id
    );

  if (!organization) {

    notFound();

  }

  async function update(
    formData: FormData
  ) {

    "use server";

    const result =
      await updateOrganizationAction(

        id,

        mapOrganizationForm(
          formData
        )

      );

    if (!result.success) {

      throw new Error(
        result.message
      );

    }

    redirect(
      "/dashboard/admin/organization"
    );

  }

  return (

    <main className="max-w-3xl mx-auto p-8">

      <PageTitle
        title="Edit Universitas"
        description="Ubah data universitas."
      />

      <OrganizationForm
        defaultValues={organization}
        submitLabel="Update Universitas"
        action={update}
      />

    </main>

  );

}