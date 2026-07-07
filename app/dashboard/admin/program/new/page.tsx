import { Container, PageHeader } from "@/components/layout";
import ProgramForm from "@/components/program/ProgramForm";

import { createProgramAction } from "../actions";

export default function NewProgramPage() {
  return (
    <Container>

      <PageHeader
        title="Tambah Program"
        description="Tambahkan program pembelajaran baru."
      />

      <ProgramForm
        onSubmit={createProgramAction}
      />

    </Container>
  );
}