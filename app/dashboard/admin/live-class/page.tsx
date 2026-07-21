import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Button } from "@/components/ui";

import LiveClassTable from "@/components/live-class/LiveClassTable";

export default function LiveClassPage() {

  return (

    <Container>

      <div className="flex items-center justify-between">

        <PageHeader
          title="Live Class"
          description="Kelola seluruh live class."
        />

        <Button
          href="/dashboard/admin/live-class/new"
        >
          Tambah Live Class
        </Button>

      </div>

      <LiveClassTable />

    </Container>

  );

}