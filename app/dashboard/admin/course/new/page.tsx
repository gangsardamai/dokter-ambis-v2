import {
  Container,
  PageHeader,
} from "@/components/layout";

import { Card } from "@/components/ui";

import {
  CourseForm,
} from "@/components/course";

import {
  createCourseAction,
} from "../actions";

import {
  organizationService,
  programService,
} from "@/services";

export default async function NewCoursePage() {

  const programs =
    await programService.getPrograms();

  const organizations =
    await organizationService.getOrganizations();

  return (

    <Container>

      <PageHeader
        title="Tambah Blok"
        description="Tambahkan blok pembelajaran baru."
      />

      <Card>

        <div className="p-6">

          <CourseForm

            programOptions={programs.map(
              (program) => ({
                value: program.id,
                label: program.title,
              })
            )}

            organizationOptions={organizations.map(
              (organization) => ({
                value: organization.id,
                label: organization.title,
              })
            )}

            onSubmit={createCourseAction}

          />

        </div>

      </Card>

    </Container>

  );

}