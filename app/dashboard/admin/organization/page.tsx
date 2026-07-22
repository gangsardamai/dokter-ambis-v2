import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";

import OrganizationTable from "@/components/admin/organization/OrganizationTable";

import { organizationService } from "@/services";

export default async function OrganizationPage() {
  const organizations =
    await organizationService.getOrganizations();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Universitas"
        description="Kelola daftar universitas."
        actions={(
          <PrimaryButton
            href="/dashboard/admin/organization/create"
            className="w-full sm:w-auto"
          >
            Tambah Universitas
          </PrimaryButton>
        )}
      />

      <OrganizationTable
        organizations={organizations}
      />
    </main>
  );
}
