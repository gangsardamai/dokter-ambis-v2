import { courseRepository } from "@/repositories";

export class CourseService {

  /**
   * Get all active courses
   */
  async getCourses() {
    return await courseRepository.getAll();
  }

  /**
   * Get course by ID
   */
  async getCourseById(id: string) {
    return await courseRepository.getById(id);
  }

  /**
   * Get course by slug
   */
  async getCourseBySlug(slug: string) {
    return await courseRepository.getBySlug(slug);
  }

  /**
   * Get courses by organization
   */
  async getCoursesByOrganization(
    organizationId: string
  ) {
    return await courseRepository.getByOrganization(
      organizationId
    );
  }

  /**
   * Count all courses
   */
  async countCourses() {
    return await courseRepository.count();
  }

}

export const courseService =
  new CourseService();