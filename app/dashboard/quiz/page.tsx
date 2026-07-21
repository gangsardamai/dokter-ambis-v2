import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  Button,
} from "@/components/ui";

import {
  QuizTable,
} from "@/components/quiz";

export default function QuizPage() {

  return (

    <Container>

      <div className="flex items-center justify-between">

        <PageHeader
          title="Quiz"
          description="Kelola seluruh quiz."
        />

        <Button
          href="/dashboard/admin/quiz/new"
        >
          Tambah Quiz
        </Button>

      </div>

      <QuizTable />

    </Container>

  );

}