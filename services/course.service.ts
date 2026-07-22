import { courseRepository, programRepository } from "@/repositories";

import type { CourseListFilters } from "@/repositories/course.repository";
import type { Database } from "@/supabase/types/database.types";

type CourseInsert = Database["public"]["Tables"]["courses"]["Insert"];
type CourseUpdate = Database["public"]["Tables"]["courses"]["Update"];

export class CourseService {
  async getCourses() { return await courseRepository.getAll(); }
  async getCourseList(filters: CourseListFilters) { return await courseRepository.getList(filters); }
  async getAvailableCourses() { return await courseRepository.getAvailableCourses(); }
  async getAvailableCourseDetails() { return await courseRepository.getAvailableCourseDetails(); }
  async getAvailableCourseDetailById(id: string) { return await courseRepository.getAvailableCourseDetailById(id); }
  async getCourseById(id: string) { return await courseRepository.getById(id); }
  async getCourseBySlug(slug: string) { return await courseRepository.getBySlug(slug); }
  async getCourseByOrganizationAndSlug(organizationId: string, slug: string) {
    return await courseRepository.getByOrganizationAndSlug(organizationId, slug);
  }
  async getCoursesByOrganization(organizationId: string) { return await courseRepository.getByOrganization(organizationId); }
  async countCourses() { return await courseRepository.count(); }

  async createCourse(data: CourseInsert) {
    await this.validateProgramOwnership(data.organization_id, data.program_id);
    await this.validateSlugAvailability(data.organization_id, data.slug);
    return await courseRepository.create({ ...data, slug: data.slug.toLowerCase() });
  }

  async updateCourse(id: string, data: CourseUpdate) {
    const existing = await courseRepository.getById(id);
    if (!existing) throw new Error("Course tidak ditemukan.");
    const organizationId = data.organization_id ?? existing.organization_id;
    const programId = data.program_id ?? existing.program_id;
    const slug = data.slug ?? existing.slug;
    await this.validateProgramOwnership(organizationId, programId);
    await this.validateSlugAvailability(organizationId, slug, id);
    return await courseRepository.update(id, { ...data, slug: slug.toLowerCase() });
  }

  async deleteCourse(id: string) { return await courseRepository.delete(id); }

  private async validateProgramOwnership(organizationId: string, programId: string) {
    const program = await programRepository.getById(programId);
    if (!program || program.organization_id !== organizationId) {
      throw new Error("Program tidak sesuai dengan Organization yang dipilih.");
    }
  }

  private async validateSlugAvailability(organizationId: string, slug: string, excludeId?: string) {
    const existing = await courseRepository.findByOrganizationAndSlug(organizationId, slug, excludeId);
    if (existing) {
      throw new Error("Slug course sudah digunakan pada Organization yang sama.");
    }
  }
}

export const courseService = new CourseService();
