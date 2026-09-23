import {
  PageHeader,
  PrimaryButton,
} from "@/components/admin";

import OrganizationTable from "@/components/admin/organization/OrganizationTable";

import { leaderAccessService, organizationService, profileService } from "@/services";

export default async function OrganizationPage() {
  const [organizations, profile] = await Promise.all([
    organizationService.getOrganizations(),
    profileService.getCurrentProfile(),
  ]);

  const manageable = await leaderAccessService.getAssignableOrganizations(organizations);

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
        organizations={manageable}
        isAdmin={profile?.role === "admin"}
      />
    </main>
  );
}
