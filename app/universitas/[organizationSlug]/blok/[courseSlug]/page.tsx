import { notFound } from "next/navigation";

import {
  organizationService,
  courseService,
  lessonService,
} from "@/services";

import LessonHeader from "@/components/materi/LessonHeader";
import LessonProgress from "@/components/materi/LessonProgress";
import LessonList from "@/components/materi/LessonList";

interface Props {
  params: Promise<{
    organizationSlug: string;
    courseSlug: string;
  }>;
}

export default async function Page({
  params,
}: Props) {

  const {
    organizationSlug,
    courseSlug,
  } = await params;

  // ==========================
  // Organization
  // ==========================

  const organization =
    await organizationService.getOrganizationBySlug(
      organizationSlug
    );

  if (!organization) {
    notFound();
  }

  // ==========================
  // Course
  // ==========================

  const course =
    await courseService.getCourseBySlug(
      courseSlug
    );

  if (!course) {
    notFound();
  }

  // ==========================
  // Security Validation
  // Pastikan course memang milik
  // organization yang sedang dibuka
  // ==========================

  if (
    course.organization_id !==
    organization.id
  ) {
    notFound();
  }

  // ==========================
  // Lessons
  // ==========================

  const lessons =
    await lessonService.getLessonsByCourse(
      course.id
    );

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">

      <LessonHeader
        title={course.title}
        description={
          course.description ?? undefined
        }
      />

      <LessonProgress
        progress={0}
      />

      <LessonList
        lessons={lessons}
      />

    </main>
  );
}