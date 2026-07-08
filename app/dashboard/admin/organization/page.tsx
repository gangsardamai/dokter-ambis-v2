import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Button } from "@/components/ui";

import OrganizationTable from "@/components/organization/OrganizationTable";

export default function OrganizationPage() {
  return (
    <Container>

      <PageHeader
        title="Universitas"
        description="Kelola seluruh universitas yang tersedia di Dokter Ambis."
      >

        <Button
          href="/dashboard/admin/organization/new"
        >
          + Tambah Universitas
        </Button>

      </PageHeader>

      <OrganizationTable />

    </Container>
  );
}