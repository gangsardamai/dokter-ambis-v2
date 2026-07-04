import { Course } from "@/types";

import { courseRepository } from "@/lib/repositories/course.repository";

export const courseService = {
  getCourses(): Course[] {
    return courseRepository.findAll();
  },

  getActiveCourses(): Course[] {
    return courseRepository.findActive();
  },

  getCourseById(
    id: string
  ): Course | undefined {
    return courseRepository.findById(id);
  },

  getCoursesByOrganization(
    organizationId: string
  ): Course[] {
    return courseRepository.findByOrganization(
      organizationId
    );
  },

  getCoursesByProgram(
    programId: string
  ): Course[] {
    return courseRepository.findByProgram(programId);
  },
};