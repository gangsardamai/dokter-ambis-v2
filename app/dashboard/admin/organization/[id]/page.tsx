import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  OrganizationInfoCard,
  OrganizationRelationCard,
  OrganizationActionCard,
} from "@/components/organization";

import { organizationService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrganizationDetailPage({
  params,
}: Props) {

  const { id } = await params;

  const organization =
    await organizationService.getOrganizationById(id);

  if (!organization) {
    notFound();
  }

  return (
    <Container>

      <PageHeader
        title={organization.title}
        description="Detail Universitas"
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <OrganizationInfoCard
            organization={organization}
          />

          <OrganizationRelationCard />

        </div>

        <div>

          <OrganizationActionCard
            organizationId={organization.id}
            status={organization.status}
          />

        </div>

      </div>

    </Container>
  );
}