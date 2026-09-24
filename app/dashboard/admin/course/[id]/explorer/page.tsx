import { notFound } from "next/navigation";

import { ExplorerPage } from "@/components/admin/explorer";

import {
  courseExplorerService,
  courseService,
  profileService,
} from "@/services";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [course, content, profile] = await Promise.all([
    courseService.getCourseById(id),
    courseExplorerService.getCourseContent(id),
    profileService.getCurrentProfile(),
  ]);

  if (!course || !profile) {
    notFound();
  }

  return (
    <ExplorerPage
      course={course}
      content={content}
      managerRole={profile.role === "leader" ? "leader" : "admin"}
    />
  );
}
