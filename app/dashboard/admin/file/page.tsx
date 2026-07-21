import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  Button,
} from "@/components/ui";

import {
  FileTable,
} from "@/components/file";

export default function FilePage() {

  return (

    <Container>

      <div className="flex items-center justify-between">

        <PageHeader
          title="File Materi"
          description="Kelola seluruh file pembelajaran."
        />

        <Button
          href="/dashboard/admin/file/new"
        >
          Tambah File
        </Button>

      </div>

      <FileTable />

    </Container>

  );

}