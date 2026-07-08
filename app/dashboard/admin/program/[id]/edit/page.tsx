import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import { ProgramForm } from "@/components/program";

import { updateProgramAction } from "../../actions";

import { programService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProgramPage({
  params,
}: Props) {

  const { id } = await params;

  const program =
    await programService.getProgramById(id);

  if (!program) {
    notFound();
  }

  return (
    <Container>

      <PageHeader
        title="Edit Program"
        description="Perbarui informasi program."
      />

      <Card>

        <div className="p-6">

          <ProgramForm
            initialData={{
              title: program.title,
              slug: program.slug,
              description:
                program.description ?? "",
              status: program.status,
            }}
            submitLabel="Simpan Perubahan"
            onSubmit={async (data) => {
              await updateProgramAction(
                program.id,
                data
              );
            }}
          />

        </div>

      </Card>

    </Container>
  );
}