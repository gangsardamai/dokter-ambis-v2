import { notFound } from "next/navigation";

import {
  Container,
  PageHeader,
} from "@/components/layout";

import {
  CourseInfoCard,
  CourseRelationCard,
  CourseActionCard,
} from "@/components/course";

import {
  courseService,
} from "@/services";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function CourseDetailPage({
  params,
}: Props) {

  const { id } = await params;

  const course =
    await courseService.getCourseById(id);

  if (!course) {
    notFound();
  }

  return (

    <Container>

      <PageHeader
        title={course.title}
        description="Detail Blok Pembelajaran"
      />

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <CourseInfoCard
            course={course}
          />

          <CourseRelationCard />

        </div>

        <div>

          <CourseActionCard
            courseId={course.id}
          />

        </div>

      </div>

    </Container>

  );

}