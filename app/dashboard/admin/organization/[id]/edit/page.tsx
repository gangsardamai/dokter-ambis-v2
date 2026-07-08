import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  OrganizationForm,
} from "@/components/organization";

import { updateOrganizationAction } from "../../actions";

import { organizationService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditOrganizationPage({
  params,
}: Props) {

  const { id } = await params;

  const organization =
    await organizationService.getOrganizationById(
      id
    );

  if (!organization) {
    notFound();
  }

  return (
    <Container>

      <PageHeader
        title="Edit Universitas"
        description="Perbarui informasi universitas."
      />

      <Card>

        <div className="p-6">

          <OrganizationForm
            initialData={{
              title: organization.title,
              short_name:
                organization.short_name,
              slug: organization.slug,
              logo_path:
                organization.logo_path ?? "",
              status:
                organization.status,
            }}
            submitLabel="Simpan Perubahan"
            onSubmit={async (data) => {
              await updateOrganizationAction(
                organization.id,
                data
              );
            }}
          />

        </div>

      </Card>

    </Container>
  );
}