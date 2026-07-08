import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Button } from "@/components/ui";

import { CourseTable } from "@/components/course";

export default function CoursePage() {
  return (
    <Container>

      <PageHeader
        title="Blok Pembelajaran"
        description="Kelola seluruh blok pembelajaran."
      >

        <Button
          href="/dashboard/admin/course/new"
        >
          + Tambah Blok
        </Button>

      </PageHeader>

      <CourseTable />

    </Container>
  );
}