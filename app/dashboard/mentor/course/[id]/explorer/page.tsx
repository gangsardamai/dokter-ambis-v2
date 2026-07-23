import { notFound } from "next/navigation";

import { ExplorerPage } from "@/components/admin/explorer";
import {
  courseExplorerService,
  courseService,
} from "@/services";

export default async function MentorCourseExplorerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [course, content] = await Promise.all([
    courseService.getCourseById(id),
    courseExplorerService.getCourseContent(id),
  ]);

  if (!course) notFound();

  return (
    <ExplorerPage
      course={course}
      content={content}
      managerRole="mentor"
    />
  );
}
