import { courseRepository } from "@/repositories";

import type { Database } from "@/supabase/types/database.types";

type CourseInsert =
  Database["public"]["Tables"]["courses"]["Insert"];

type CourseUpdate =
  Database["public"]["Tables"]["courses"]["Update"];

export class CourseService {

  /* ========================================
     READ
  ======================================== */

  async getCourses() {
    return await courseRepository.getAll();
  }

  async getCourseById(
    id: string
  ) {
    return await courseRepository.getById(id);
  }

  async getCourseBySlug(
    slug: string
  ) {
    return await courseRepository.getBySlug(slug);
  }

  async getCoursesByOrganization(
    organizationId: string
  ) {
    return await courseRepository.getByOrganization(
      organizationId
    );
  }

  async countCourses() {
    return await courseRepository.count();
  }

  /* ========================================
     CREATE
  ======================================== */

  async createCourse(
    data: CourseInsert
  ) {
    return await courseRepository.create(
      data
    );
  }

  /* ========================================
     UPDATE
  ======================================== */

  async updateCourse(
    id: string,
    data: CourseUpdate
  ) {
    return await courseRepository.update(
      id,
      data
    );
  }

  /* ========================================
     DELETE
  ======================================== */

  async deleteCourse(
    id: string
  ) {
    return await courseRepository.delete(
      id
    );
  }

}

export const courseService =
  new CourseService();