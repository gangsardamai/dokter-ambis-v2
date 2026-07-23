import { notFound } from "next/navigation";

import { ExplorerPage } from "@/components/admin/explorer";

import {
  courseService,
  folderService,
  lessonService,
} from "@/services";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [course, folders, lessons] = await Promise.all([
    courseService.getCourseById(id),
    folderService.getFoldersByCourse(id),
    lessonService.getLessonsByCourse(id),
  ]);

  if (!course) {
    notFound();
  }

  return (
    <ExplorerPage
      course={course}
      folders={folders}
      lessonCount={lessons.length}
    />
  );
}
