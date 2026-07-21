
import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  Button,
} from "@/components/ui";

import {
  LessonTable,
} from "@/components/lesson";

export default function LessonPage() {

  return (

    <Container>

      <div className="flex items-center justify-between">

        <PageHeader
          title="Materi"
          description="Kelola seluruh materi pembelajaran."
        />

       <Button
  href="/dashboard/admin/lesson/new"
>
  Tambah Materi
</Button>

      </div>

      <LessonTable />

    </Container>

  );

}