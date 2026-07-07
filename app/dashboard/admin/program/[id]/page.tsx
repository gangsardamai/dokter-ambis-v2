import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  ProgramInfoCard,
  ProgramRelationCard,
  ProgramActionCard,
} from "@/components/program";

import { programService } from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProgramDetailPage({
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
        title={program.title}
        description="Detail Program Pembelajaran"
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <ProgramInfoCard
            program={program}
          />

          <ProgramRelationCard />

        </div>

        <div>

          <ProgramActionCard
            programId={program.id}
            status={program.status}
          />

        </div>

      </div>

    </Container>
  );

}