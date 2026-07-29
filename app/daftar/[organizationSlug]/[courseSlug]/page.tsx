import { notFound, redirect } from "next/navigation";

import {
  courseService,
  organizationService,
} from "@/services";

export const dynamic = "force-dynamic";

interface DirectCourseRegistrationPageProps {
  params: Promise<{
    organizationSlug: string;
    courseSlug: string;
  }>;
}

export default async function DirectCourseRegistrationPage({
  params,
}: DirectCourseRegistrationPageProps) {
  const { organizationSlug, courseSlug } = await params;

  const organization = await organizationService.getOrganizationBySlug(
    organizationSlug.toLowerCase(),
  );

  if (!organization || organization.status !== "active") {
    notFound();
  }

  const course = await courseService.getCourseByOrganizationAndSlug(
    organization.id,
    courseSlug.toLowerCase(),
  );

  if (!course || course.status !== "active") {
    notFound();
  }

  redirect(`/kelas/${course.id}`);
}
