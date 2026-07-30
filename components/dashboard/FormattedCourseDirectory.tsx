"use client";

import CourseDirectory, {
  type DashboardCourseItem,
} from "./CourseDirectory";
import { getCourseDescriptionSummary } from "@/lib/course-description";

interface FormattedCourseDirectoryProps {
  courses: DashboardCourseItem[];
  searchPlaceholder: string;
  emptyTitle: string;
  emptyDescription: string;
  showFilters?: boolean;
}

export default function FormattedCourseDirectory({
  courses,
  ...props
}: FormattedCourseDirectoryProps) {
  const formattedCourses = courses.map((course) => ({
    ...course,
    description: getCourseDescriptionSummary(course.description),
  }));

  return <CourseDirectory courses={formattedCourses} {...props} />;
}
