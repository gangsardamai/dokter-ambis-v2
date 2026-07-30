"use client";

import PublicCourseCatalog, {
  type PublicCourseCatalogItem,
  type PublicOrganizationOption,
} from "./PublicCourseCatalog";
import { getCourseDescriptionSummary } from "@/lib/course-description";

interface FormattedPublicCourseCatalogProps {
  courses: PublicCourseCatalogItem[];
  organizationOptions: PublicOrganizationOption[];
  initialOrganizationSlug?: string;
}

export default function FormattedPublicCourseCatalog({
  courses,
  ...props
}: FormattedPublicCourseCatalogProps) {
  const formattedCourses = courses.map((course) => ({
    ...course,
    description: getCourseDescriptionSummary(course.description),
  }));

  return <PublicCourseCatalog courses={formattedCourses} {...props} />;
}
