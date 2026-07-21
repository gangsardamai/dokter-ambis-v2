import Link from "next/link";

import {
  PageHeader,
  PrimaryButton,
 } from "@/components/admin";

import OrganizationTable
from "@/components/admin/organization/OrganizationTable";

import {
  organizationService,
} from "@/services";

export default async function OrganizationPage() {

  const organizations =
    await organizationService.getOrganizations();

  return (

    <main className="max-w-7xl mx-auto p-8 space-y-8">

      <PageHeader

        title="Universitas"

        description="Kelola daftar universitas."

        actions={

          <Link
            href="/dashboard/admin/organization/create"
          >

            <PrimaryButton>

              Tambah Universitas

            </PrimaryButton>

          </Link>

        }

      />

      <OrganizationTable
        organizations={organizations}
      />

    </main>

  );

}