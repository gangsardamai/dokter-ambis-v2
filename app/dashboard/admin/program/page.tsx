import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Button } from "@/components/ui";

import ProgramTable from "@/components/program/ProgramTable";

export default function ProgramPage() {
  return (
    <Container>

      <PageHeader
        title="Program"
        description="Kelola seluruh program pembelajaran Dokter Ambis."
      >

        <Button
          href="/dashboard/admin/program/new"
        >
          + Tambah Program
        </Button>

      </PageHeader>

      <ProgramTable />

    </Container>
  );
}