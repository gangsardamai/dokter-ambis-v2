import { notFound } from "next/navigation";

import { ExplorerPage } from "@/components/admin/explorer";
import {
  courseExplorerService,
  courseService,
  profileService,
  tryoutService,
} from "@/services";

export default async function MentorCourseExplorerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [course, content, profile, tryouts] = await Promise.all([
    courseService.getCourseById(id),
    courseExplorerService.getCourseContent(id),
    profileService.getCurrentProfile(),
    tryoutService.getCourseTryoutCards(id),
  ]);

  if (!course || !profile || profile.role !== "mentor") notFound();

  return (
    <ExplorerPage
      course={course}
      content={content}
      tryouts={tryouts}
      currentProfileId={profile.id}
      managerRole="mentor"
    />
  );
}
