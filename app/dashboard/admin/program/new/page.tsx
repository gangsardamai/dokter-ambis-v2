import { Container, PageHeader } from "@/components/layout";

import ProgramForm
from "@/components/program/ProgramForm";

import {
  createProgramAction,
} from "../actions";

export default function NewProgramPage() {

  async function handleSubmit(data: Parameters<typeof createProgramAction>[0]) {

    "use server";

    const result =
      await createProgramAction(data);

    if (!result.success) {

      throw new Error(
        result.message
      );

    }

  }

  return (

    <Container>

      <PageHeader
        title="Tambah Program"
        description="Tambahkan program pembelajaran baru."
      />

      <ProgramForm
        onSubmit={handleSubmit}
      />

    </Container>

  );

}